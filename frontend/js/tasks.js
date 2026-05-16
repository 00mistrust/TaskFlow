// js/tasks.js
const BASE_URL = 'http://localhost:5000/api/tasks';
const token = localStorage.getItem('token');
let currentPage = 1;

if (!token) window.location.href = 'login.html';

const user = JSON.parse(localStorage.getItem('user') || '{}');
if (user.name || user.nom) document.getElementById('userName').textContent = user.name || user.nom;

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

// VARIABLES DE VUES ET PROJET ACTUEL
// Add this line where your other DOM variables (vueProjets, vueTaches, etc.) are declared:
const btnNouvelleTache = document.querySelector('[data-bs-target="#addTaskModal"]');
const vueProjets = document.getElementById('vueProjets');
const vueTaches = document.getElementById('vueTaches');
const grilleProjets = document.getElementById('grilleProjets');
const btnRetourProjets = document.getElementById('btnRetourProjets');
const titreProjetActuel = document.getElementById('titreProjetActuel');

let projetActuelId = null; 
let projetActuelData = null; // Stores owner information to manage roles dynamically

// GESTION DES VUES (PROJETS)
async function chargerProjetsPourTaches() {
    try {
        const response = await fetch('http://localhost:5000/api/projects', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const result = await response.json();
            // Fallback strategy to find the data list depending on backend payload structure
            const projects = result.data || result || [];
            
            grilleProjets.innerHTML = '';
            
            if (projects.length === 0) {
                grilleProjets.innerHTML = '<div class="col-12 text-center text-muted">Aucun projet trouvé. Créez-en un ou attendez d\'être invité !</div>';
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

    // First load members (and find project owner), then look up the tasks
    loadMembers().then(() => {
        loadTasks(1);
    });
}

btnRetourProjets.addEventListener('click', () => {
    projetActuelId = null; 
    projetActuelData = null;
    vueTaches.classList.add('d-none');
    vueProjets.classList.remove('d-none');
});


// GESTION DES TÂCHES
async function loadTasks(page = 1) {
    if (!projetActuelId) return; 

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

        const url = `${BASE_URL}/project/${projetActuelId}?${query}`;

        const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Fixed Data parsing bug (handles root array fallback or object wrap cleanly)
        const rawTasks = res.data.data || (Array.isArray(res.data) ? res.data : []);
        
        renderTasks(rawTasks);
        
        const currentP = res.data.page || page;
        const totalP = res.data.totalPages || 1;
        renderPagination(currentP, totalP);
        currentPage = currentP;
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

    // 1. EXTRACT LOGGED-IN USER FROM TOKEN (Guarantees matching formats)
    let currentUserId = null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUserId = String(payload.id || payload._id || payload.userId || '').trim();
    } catch (e) {
        console.error("Erreur de lecture du token dans renderTasks", e);
    }

    // 2. EXTRACT PROJECT OWNER ID
    let projectOwnerId = '';
    if (projetActuelData && projetActuelData.owner) {
        if (typeof projetActuelData.owner === 'object') {
            projectOwnerId = projetActuelData.owner._id || projetActuelData.owner.id || '';
        } else {
            projectOwnerId = projetActuelData.owner;
        }
    }
    projectOwnerId = String(projectOwnerId).trim();

    // Final ownership evaluation
    const isProjectOwner = (currentUserId && projectOwnerId && currentUserId === projectOwnerId);

    list.innerHTML = tasks.map(task => {
        const priorityClass = { 'haute': 'badge-priority-haute', 'moyenne': 'badge-priority-moyenne', 'basse': 'badge-priority-basse' }[task.priority] || 'bg-secondary';
        const statusClass = { 'à faire': 'badge-status-afaire', 'en cours': 'badge-status-encours', 'terminé': 'badge-status-termine' }[task.status] || 'bg-secondary';
        const descriptionText = task.description ? `<p class="card-text small text-muted mb-3">${task.description}</p>` : '';
        const descEscaped = (task.description || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        let assignedEmail = null;
        let assigneeId = null;

        if (task.assignedTo) {
            if (typeof task.assignedTo === 'object' && task.assignedTo !== null) {
                assigneeId = task.assignedTo._id || task.assignedTo.id;
                assignedEmail = task.assignedTo.email || task.assignedTo.name || task.assignedTo.nom;
            } else {
                assigneeId = task.assignedTo;
            }

            if (!assignedEmail) {
                const selectMembres = document.getElementById('taskAssignedTo');
                if (selectMembres) {
                    const option = Array.from(selectMembres.options).find(opt => opt.value === assigneeId);
                    if (option && option.value !== "") {
                        assignedEmail = option.text;
                    }
                }
            }
            
            if (!assignedEmail && assigneeId) {
                assignedEmail = "Membre assigné"; 
            }
        }

        // TEXT DISPLAY FOR ASSIGNED USER
        let assignedNameHTML = assignedEmail 
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

        // OWNER ONLY: Add inline re-assignment selector menu
        if (isProjectOwner) {
            assignedNameHTML += `
                <div class="mt-2">
                    <select id="assign-${task._id}" class="form-select form-select-sm shadow-sm" onchange="assignTask('${task._id}')">
                        <option value="">-- Réassigner la tâche --</option>
                        ${membersCache.map(member => `
                            <option value="${member._id || member.id}" ${String(assigneeId) === String(member._id || member.id) ? 'selected' : ''}>
                                ${member.email || member.name || member.nom}
                            </option>
                        `).join('')}
                    </select>
                </div>`;
        }

        // STATUS DROPDOWN (Visible to everyone)
        let actionButtons = `
            <select class="form-select form-select-sm w-auto shadow-sm" style="min-width: 110px;" onchange="updateStatus('${task._id}', this.value)">
                <option value="à faire" ${task.status === 'à faire' ? 'selected' : ''}>À faire</option>
                <option value="en cours" ${task.status === 'en cours' ? 'selected' : ''}>En cours</option>
                <option value="terminé" ${task.status === 'terminé' ? 'selected' : ''}>Terminé</option>
            </select>
        `;

        // --- FIXED LAYER: ONLY THE OWNER SEES THE EDIT AND DELETE BUTTONS ---
        if (isProjectOwner) {
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
        
        localStorage.removeItem('draft_' + projetActuelId);
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
    } catch (err) { 
        alert(err.response?.data?.error || 'Erreur lors de la mise à jour.'); 
    }
}

async function deleteTask(id) {
    if (!confirm('Supprimer cette tâche ?')) return;
    try {
        await axios.delete(`${BASE_URL}/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        loadTasks(currentPage);
    } catch (err) { 
        alert(err.response?.data?.error || 'Erreur lors de la suppression.'); 
    }
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
        
        projetActuelData = res.data.data || res.data;
        membersCache = projetActuelData.members || [];

        // 1. MATCH THE IDENTITY SYSTEM FROM PROJECTS.JS EXACTLY
        let currentUserId = null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUserId = String(payload.id || payload._id || payload.userId || '').trim();
        } catch (e) {
            console.error("Erreur de lecture du token dans tasks.js", e);
        }
        
        // Extract the owner's ID whether populated as an object or a flat ID string
        let projectOwnerId = '';
        if (projetActuelData && projetActuelData.owner) {
            if (typeof projetActuelData.owner === 'object') {
                projectOwnerId = projetActuelData.owner._id || projetActuelData.owner.id || '';
            } else {
                projectOwnerId = projetActuelData.owner;
            }
        }
        projectOwnerId = String(projectOwnerId).trim();

        // Debug prints to verify consistency in browser dev console (F12)
        console.log("ID utilisateur connecté (Token) :", currentUserId);
        console.log("ID Propriétaire du projet (Backend) :", projectOwnerId);

        // Perform evaluation logic
        const isProjectOwner = (currentUserId && projectOwnerId && currentUserId === projectOwnerId);

        // 2. TOGGLE "NOUVELLE TÂCHE" BUTTON DISPLAY VISIBILITY
        if (btnNouvelleTache) {
            if (isProjectOwner) {
                console.log("👉 Résultat : Propriétaire détecté. Bouton affiché.");
                btnNouvelleTache.classList.remove('d-none'); // Show it
            } else {
                console.log("👉 Résultat : Membre invité détecté. Bouton masqué.");
                btnNouvelleTache.classList.add('d-none');    // Hide it
            }
        }

        // 3. RE-POPULATE FILTER SELECTORS & FORM INPUTS (Completely Untouched)
        const filterSelect = document.getElementById('filterMember');
        if (filterSelect) filterSelect.innerHTML = '<option value="">Tous les membres</option>';
        
        const assignSelect = document.getElementById('taskAssignedTo');
        if (assignSelect) assignSelect.innerHTML = '<option value="">-- Non assigné --</option>';

        membersCache.forEach(member => {
            const option = document.createElement('option');
            option.value = member._id || member.id; 
            option.textContent = member.email || member.name || member.nom;
            
            if (filterSelect) filterSelect.appendChild(option.cloneNode(true));
            if (assignSelect) assignSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Erreur de chargement des membres dans loadMembers:', err);
    }
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