const BASE_URL = 'http://localhost:5000/api/tasks';
const token = localStorage.getItem('token');
let currentPage = 1;

if (!token) window.location.href = 'login.html';

const user = JSON.parse(localStorage.getItem('user') || '{}');
if (user.name) document.getElementById('userName').textContent = user.name;

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});


// VARIABLES DE VUES ET PROJET ACTUEL

const vueProjets = document.getElementById('vueProjets');
const vueTaches = document.getElementById('vueTaches');
const grilleProjets = document.getElementById('grilleProjets');
const btnRetourProjets = document.getElementById('btnRetourProjets');
const titreProjetActuel = document.getElementById('titreProjetActuel');

// C'est cette variable qui remplace ton ancien PROJECT_ID dans l'URL !
let projetActuelId = null; 


// GESTION DES VUES (PROJETS)
async function chargerProjetsPourTaches() {
    try {
        const response = await fetch('http://localhost:5000/api/projects', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const result = await response.json();
            const projects = result.data || result || [];
            
            grilleProjets.innerHTML = '';
            
            if (projects.length === 0) {
                grilleProjets.innerHTML = '<div class="col-12 text-center text-muted">Aucun projet trouvé. Créez-en un d\'abord !</div>';
                return;
            }

            projects.forEach(project => {
                const col = document.createElement('div');
                col.className = 'col-md-4';
                col.innerHTML = `
                    <div class="card h-100 shadow-sm border-0" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
                        <div class="card-body text-center py-5">
                            <i class="bi bi-folder-fill display-4 text-primary mb-3"></i>
                            <h5 class="card-title fw-bold">${project.title}</h5>
                            <p class="text-muted small">Cliquez pour gérer les tâches</p>
                        </div>
                    </div>
                `;
                
                col.addEventListener('click', () => {
                    ouvrirVueTaches(project._id, project.title);
                });
                
                grilleProjets.appendChild(col);
            });
        }
    } catch (error) {
        console.error("Erreur chargement projets :", error);
    }
}

function ouvrirVueTaches(projectId, projectTitle) {
    projetActuelId = projectId; 
    titreProjetActuel.innerHTML = `Tâches : <strong>${projectTitle}</strong>`;
    
    vueProjets.classList.add('d-none');
    vueTaches.classList.remove('d-none');

    // On lance le chargement des tâches ET des membres pour CE projet 
    loadTasks(1);
    loadMembers();
}

btnRetourProjets.addEventListener('click', () => {
    projetActuelId = null; 
    vueTaches.classList.add('d-none');
    vueProjets.classList.remove('d-none');
});


// GESTION DES TÂCHES

async function loadTasks(page = 1) {
    if (!projetActuelId) return; // On ne charge pas si aucun projet n'est sélectionné

    try {
        const search = document.getElementById('searchInput').value;
        const status = document.getElementById('filterStatus').value;
        const priority = document.getElementById('filterPriority').value;
        const member = document.getElementById('filterMember').value;

        const query = new URLSearchParams();
        query.append('page', page);
        query.append('limit', 6);
        if (search) query.append('search', search);
        if (status) query.append('status', status);
        if (priority) query.append('priority', priority);
        if (member) query.append('assignedTo', member);

        // On utilise projetActuelId pour filtrer l'URL !
        const url = `${BASE_URL}/project/${projetActuelId}?${query}`;

        const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        renderTasks(res.data.data);
        renderPagination(res.data.page, res.data.totalPages);
        currentPage = res.data.page;
    } catch (err) {
        if (err.response?.status === 401) window.location.href = 'login.html';
        document.getElementById('taskList').innerHTML = `
            <div class="empty-state col-12">
                <i class="bi bi-exclamation-circle fs-1 mb-3 d-block text-danger"></i>
                <p>Erreur lors du chargement des tâches.</p>
            </div>`;
    }
}

function renderTasks(tasks) {
    const list = document.getElementById('taskList');
    if (!tasks || tasks.length === 0) {
        list.innerHTML = `
            <div class="empty-state col-12">
                <i class="bi bi-inbox fs-1 mb-3 d-block text-muted"></i>
                <p>Aucune tâche trouvée pour ce projet.</p>
            </div>`;
        return;
    }

    // 1. Récupérer l'ID de l'utilisateur connecté
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = currentUser._id || currentUser.id;

    list.innerHTML = tasks.map(task => {
        console.log("Inspectons la tâche :", task);
        const priorityClass = { 'haute': 'badge-priority-haute', 'moyenne': 'badge-priority-moyenne', 'basse': 'badge-priority-basse' }[task.priority] || 'bg-secondary';
        const statusClass = { 'à faire': 'badge-status-afaire', 'en cours': 'badge-status-encours', 'terminé': 'badge-status-termine' }[task.status] || 'bg-secondary';
        const descriptionText = task.description ? `<p class="card-text small text-muted mb-3">${task.description}</p>` : '';
        const descEscaped = (task.description || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
// 2. RECHERCHE DE L'EMAIL DU MEMBRE ASSIGNÉ
        let assignedEmail = null;
        let assigneeId = null;

        if (task.assignedTo) {
            // Si le backend envoie un objet (ex: { _id: "...", email: "a@a.com" })
            if (typeof task.assignedTo === 'object' && task.assignedTo !== null) {
                assigneeId = task.assignedTo._id || task.assignedTo.id;
                assignedEmail = task.assignedTo.email || task.assignedTo.name;
            } 
            // Si le backend envoie juste une chaîne de caractères (l'ID)
            else {
                assigneeId = task.assignedTo;
            }

            // LE CORRECTIF EST ICI : 
            // Si la personne assignée est l'utilisateur actuellement connecté, 
            // on pioche son email directement dans le localStorage !
            if (assigneeId === currentUserId && currentUser.email) {
                assignedEmail = currentUser.email;
            }

            // Fallback : on essaie quand même de chercher dans le select (au cas où c'est assigné à un AUTRE membre)
            if (!assignedEmail) {
                const selectMembres = document.getElementById('taskAssignedTo');
                if (selectMembres) {
                    const option = Array.from(selectMembres.options).find(opt => opt.value === assigneeId);
                    if (option && option.value !== "") {
                        assignedEmail = option.text;
                    }
                }
            }
            
            // Si on a vraiment un ID mais qu'on n'a pas pu trouver l'email
            if (!assignedEmail && assigneeId) {
                assignedEmail = "Membre assigné (Email masqué)"; 
            }
        }

        // Création de l'affichage de l'email
        const assignedNameHTML = assignedEmail 
            ? `<div class="d-flex align-items-center mt-3 pt-3 border-top">
                 <div class="bg-light rounded-circle d-flex justify-content-center align-items-center me-2" style="width: 32px; height: 32px;">
                   <i class="bi bi-envelope-at-fill text-primary"></i>
                 </div>
                 <div class="small text-truncate" title="${assignedEmail}">
                   <span class="text-muted d-block" style="font-size: 0.75rem;">Assigné à</span>
                   <span class="fw-semibold text-dark">${assignedEmail}</span>
                 </div>
               </div>` 
            : `<div class="d-flex align-items-center mt-3 pt-3 border-top text-muted small">
                 <i class="bi bi-person-x me-2 fs-5"></i> Non assigné
               </div>`;

        // 3. GESTION DES PERMISSIONS
        const isAssignedToMe = (assigneeId === currentUserId);
        const isAdmin = (task.createdBy === currentUserId);
        
        // A-t-il le droit d'éditer la tâche entière ? (Oui s'il est admin, ou s'il n'est PAS assigné à ça)
        // (Si le prof veut que la personne assignée ne puisse QUE changer le statut, canEditFull doit être faux pour lui)
        const canEditFull = isAdmin || !isAssignedToMe; 

        // Menu déroulant du statut (tout le monde le voit)
        let actionButtons = `
            <select class="form-select form-select-sm w-auto shadow-sm" style="min-width: 110px;" onchange="updateStatus('${task._id}', this.value)">
                <option value="à faire" ${task.status === 'à faire' ? 'selected' : ''}>À faire</option>
                <option value="en cours" ${task.status === 'en cours' ? 'selected' : ''}>En cours</option>
                <option value="terminé" ${task.status === 'terminé' ? 'selected' : ''}>Terminé</option>
            </select>
        `;

        // Boutons Modifier/Supprimer (Cachés pour la personne assignée)
        if (canEditFull) {
            actionButtons += `
                <button class="btn btn-outline-primary btn-sm ms-auto shadow-sm" onclick="openEdit('${task._id}', '${task.title.replace(/'/g, "\\'")}', '${descEscaped}', '${task.priority}', '${task.status}')" title="Modifier">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger btn-sm shadow-sm" onclick="deleteTask('${task._id}')" title="Supprimer">
                    <i class="bi bi-trash"></i>
                </button>
            `;
        }

        return `
            <div class="col-md-6 col-lg-4">
                <div class="card task-card shadow-sm h-100">
                    <div class="card-body p-4 d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title fw-bold mb-0" style="color: #1f2937;">${task.title}</h6>
                            <span class="badge ${priorityClass} text-white ms-2">${task.priority}</span>
                        </div>
                        ${descriptionText}
                        <span class="badge ${statusClass} text-white mb-2 align-self-start">${task.status}</span>
                        
                        <div class="mt-auto">
                            ${assignedNameHTML}
                            <div class="d-flex gap-2 mt-3 align-items-center flex-wrap d-flex">
                                ${actionButtons}
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

function renderPagination(page, totalPages) {
    const div = document.getElementById('pagination');
    if (totalPages <= 1) { div.innerHTML = ''; return; }
    div.innerHTML = `
        <button class="pagination-btn" onclick="loadTasks(${page - 1})" ${page <= 1 ? 'disabled' : ''}>
            <i class="bi bi-chevron-left"></i> Précédent
        </button>
        <span class="text-muted small">Page ${page} / ${totalPages}</span>
        <button class="pagination-btn" onclick="loadTasks(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>
            Suivant <i class="bi bi-chevron-right"></i>
        </button>`;
}

async function addTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;
    const description = document.getElementById('taskDescription').value;
    const assignedTo = document.getElementById('taskAssignedTo').value;
    const errorDiv = document.getElementById('formError');
    if (!title || !priority || !status) {
        errorDiv.textContent = 'Veuillez remplir tous les champs obligatoires.';
        errorDiv.classList.remove('d-none');
        return;
    }
    errorDiv.classList.add('d-none');

    try {
        // On utilise le VRAI projetActuelId ici
        const body = { title, description, priority, status, project: projetActuelId };
        if (assignedTo) body.assignedTo = assignedTo;

        await axios.post(BASE_URL, body, {
            headers: { Authorization: `Bearer ${token}` }
        });

        bootstrap.Modal.getInstance(document.getElementById('addTaskModal')).hide();
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskPriority').value = '';
        document.getElementById('taskStatus').value = '';
        document.getElementById('taskAssignedTo').value = '';
        
        const draftKey = 'draft_' + projetActuelId;
        localStorage.removeItem(draftKey);
        loadTasks(currentPage);
    } catch (err) {
        errorDiv.textContent = err.response?.data?.error || 'Erreur lors de l\'ajout.';
        errorDiv.classList.remove('d-none');
    }
}

function openEdit(id, title, description, priority, status) {
    document.getElementById('editTaskId').value = id;
    document.getElementById('editTaskTitle').value = title;
    document.getElementById('editTaskDescription').value = description;
    document.getElementById('editTaskPriority').value = priority;
    document.getElementById('editTaskStatus').value = status;
    document.getElementById('editFormError').classList.add('d-none');
    new bootstrap.Modal(document.getElementById('editTaskModal')).show();
}

async function saveEdit() {
    const id = document.getElementById('editTaskId').value;
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDescription').value;
    const priority = document.getElementById('editTaskPriority').value;
    const status = document.getElementById('editTaskStatus').value;
    const errorDiv = document.getElementById('editFormError');

    if (!title) {
        errorDiv.textContent = 'Le titre est obligatoire.';
        errorDiv.classList.remove('d-none');
        return;
    }
    errorDiv.classList.add('d-none');

    try {
        await axios.put(`${BASE_URL}/${id}`, {
            title, description, priority, status
        }, { headers: { Authorization: `Bearer ${token}` } });

        bootstrap.Modal.getInstance(document.getElementById('editTaskModal')).hide();
        loadTasks(currentPage);
    } catch (err) {
        errorDiv.textContent = err.response?.data?.error || 'Erreur lors de la modification.';
        errorDiv.classList.remove('d-none');
    }
}

async function updateStatus(id, status) {
    try {
        await axios.patch(`${BASE_URL}/${id}/status`, { status }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        loadTasks(currentPage);
    } catch (err) { alert('Erreur lors de la mise à jour.'); }
}

async function assignTask(taskId) {
    const select = document.getElementById(`assign-${taskId}`);
    const assignedTo = select.value;
    if (!assignedTo) return alert('Veuillez choisir un membre.');
    try {
        await axios.patch(`${BASE_URL}/${taskId}/assign`, { assignedTo }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        loadTasks(currentPage);
    } catch (err) {
        alert('Erreur lors de l\'assignation.');
    }
}

async function deleteTask(id) {
    if (!confirm('Supprimer cette tâche ?')) return;
    try {
        await axios.delete(`${BASE_URL}/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        loadTasks(currentPage);
    } catch (err) { alert('Erreur lors de la suppression.'); }
}

function applyFilters() { loadTasks(1); }
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterPriority').value = '';
    document.getElementById('filterMember').value = '';
    loadTasks(1);
}

let membersCache = [];

async function loadMembers() {
    if (!projetActuelId) return;
    try {
        const res = await axios.get(`http://localhost:5000/api/projects/${projetActuelId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // On récupère le projet proprement
        const project = res.data.data || res.data;
        
        // ✅ CORRECTION ICI : On utilise "project" et non "res.data"
        membersCache = project.members || [];

        const filterSelect = document.getElementById('filterMember');
        if (filterSelect) filterSelect.innerHTML = '<option value="">Tous les membres</option>';
        
        const assignSelect = document.getElementById('taskAssignedTo');
        if (assignSelect) assignSelect.innerHTML = '<option value="">Sélectionner un membre</option>';

        membersCache.forEach(member => {
            const option = document.createElement('option');
            option.value = member._id; // Si membersCache était vide, ça ne mettait jamais de _id !
            option.textContent = member.name || member.email;
            
            if (filterSelect) filterSelect.appendChild(option.cloneNode(true));
            if (assignSelect) assignSelect.appendChild(option);
        });
    } catch (err) {
        console.log('Membres non disponibles pour l\'instant', err);
    }
}

function loadMembersForAssign() {
    if (!membersCache.length) return;
    document.querySelectorAll('[id^="assign-"]').forEach(select => {
        select.innerHTML = '<option value="">Assigner à...</option>'; // Reset
        membersCache.forEach(member => {
            const option = document.createElement('option');
            option.value = member._id;
            option.textContent = member.name || member.email;
            select.appendChild(option);
        });
    });
}

// Brouillons dynamiques par projet
['taskTitle', 'taskPriority', 'taskStatus'].forEach(id => {
    const el = document.getElementById(id);
    if(el) {
        el.addEventListener('input', () => {
            if(!projetActuelId) return;
            const draft = {
                title: document.getElementById('taskTitle').value,
                priority: document.getElementById('taskPriority').value,
                status: document.getElementById('taskStatus').value,
                assignedTo: document.getElementById('taskAssignedTo').value
            };
            localStorage.setItem('draft_' + projetActuelId, JSON.stringify(draft));
        });
    }
});

const modalEl = document.getElementById('addTaskModal');
if(modalEl) {
    modalEl.addEventListener('show.bs.modal', () => {
        if(!projetActuelId) return;
        const saved = localStorage.getItem('draft_' + projetActuelId);
        if (saved) {
            const draft = JSON.parse(saved);
            if ((draft.title || draft.priority || draft.status) && confirm('💾 Brouillon détecté — Voulez-vous le restaurer ?')) {
                document.getElementById('taskTitle').value = draft.title || '';
                document.getElementById('taskPriority').value = draft.priority || '';
                document.getElementById('taskStatus').value = draft.status || '';
            }
        }
    });
}

async function pollNotifications() {
    try {
        const res = await axios.get('http://localhost:5000/api/notifications', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const unread = res.data.filter(n => !n.read).length;
        const badge = document.getElementById('notifBadge');
        if(badge) badge.textContent = unread;
        const read = res.data.filter(n => n.read);
        localStorage.setItem('notifications_archived', JSON.stringify(read));
    } catch (err) {
        console.log('Notifications non disponibles');
    }
}

// DÉMARRAGE DE LA PAGE
pollNotifications();
setInterval(pollNotifications, 30000);
chargerProjetsPourTaches();
