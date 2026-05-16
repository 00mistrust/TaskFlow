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
// VARIABLES DE VUES ET PROJET ACTUEL
const btnNouvelleTache = document.querySelector('[data-bs-target="#addTaskModal"]');
const vueProjets = document.getElementById('vueProjets');
const vueTaches = document.getElementById('vueTaches');
const grilleProjets = document.getElementById('grilleProjets');
const btnRetourProjets = document.getElementById('btnRetourProjets');


// VARIABLES DU PROJET ACTUEL ET LECTURE DE L'URL
const urlParams = new URLSearchParams(window.location.search);
let projetActuelId = urlParams.get('id'); // Déclaré une seule fois ici !
let projetActuelData = null; 

console.log("ID du projet récupéré dans l'URL :", projetActuelId);

// GESTION DU BOUTON RETOUR
if (btnRetourProjets) {
    btnRetourProjets.addEventListener('click', () => {
        projetActuelId = null; 
        projetActuelData = null;
        // On nettoie l'URL pour enlever le ?id= si on clique sur Retour
        window.history.pushState({}, document.title, window.location.pathname);
        vueTaches.classList.add('d-none');
        vueProjets.classList.remove('d-none');
        chargerProjetsPourTaches(); 
    });
}

// INITIALISATION AU CHARGEMENT DE LA PAGE
document.addEventListener('DOMContentLoaded', () => {
    if (projetActuelId) {
        // Cas 1 : On arrive depuis "Mes Projets" en cliquant sur "Tâches"
        vueProjets.classList.add('d-none');
        vueTaches.classList.remove('d-none');
        
        // On charge les infos du projet, puis les tâches
        loadMembers().then(() => {
            if(projetActuelData && projetActuelData.title) {
                titreProjetActuel.innerHTML = `Tâches : <strong>${projetActuelData.title}</strong>`;
            }
            loadTasks(1);
        });
    } else {
        // Cas 2 : On ouvre juste tasks.html via le menu de navigation (pas d'ID)
        vueTaches.classList.add('d-none');
        vueProjets.classList.remove('d-none');
        chargerProjetsPourTaches();
    }
});

async function chargerProjetsPourTaches() {
    if (!grilleProjets) return;

    // 1. Extraction propre de l'ID utilisateur connecté depuis le Token
    let currentUserId = null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUserId = String(payload.id || payload._id || payload.userId || '').trim();
    } catch (e) {
        console.error("Erreur de lecture du token dans tasks.js", e);
    }

    try {
        const response = await fetch('http://localhost:5000/api/projects', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const result = await response.json();
            const projects = result.data || result || [];

            // Sélection des deux conteneurs (Gauche et Droite)
            const gaucheContainer = document.getElementById('grilleProjets'); // Colonne de gauche
            const droiteContainer = document.getElementById('mesTachesAssigneesList'); // Colonne de droite

            // On vide les conteneurs avant de les remplir
            gaucheContainer.innerHTML = '';
            droiteContainer.innerHTML = '';

            let hasOwned = false;
            let hasAssigned = false;

            projects.forEach(project => {
                // Détermination de l'ID du propriétaire
                let ownerId = '';
                if (project.owner) {
                    ownerId = typeof project.owner === 'object' ? (project.owner._id || project.owner.id) : project.owner;
                }
                ownerId = String(ownerId).trim();
                
                const ownerName = project.owner && typeof project.owner === 'object' 
                    ? (project.owner.name || project.owner.nom || 'Quelqu\'un') 
                    : 'Inconnu';

                // Formatage de la date limite
                const dateAffichee = project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Non défini';

                // Structure HTML d'une carte projet simplifiée pour l'onglet Tâches
                const cardHTML = `
                    <div class="card shadow-sm border-0 mb-3 task-card">
                        <div class="card-body p-3">
                            <h5 class="card-title text-primary fw-bold h6 mb-1">${project.title}</h5>
                            ${ownerId !== currentUserId ? `<p class="mb-1 small text-muted"><i class="bi bi-person"></i> Par : ${ownerName}</p>` : ''}
                            <p class="card-text text-muted small mb-2 text-truncate">${project.description || 'Pas de description'}</p>
                            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <span class="text-secondary style="font-size: 0.75rem;"><i class="bi bi-calendar-event"></i> Délai : ${dateAffichee}</span>
                                <button class="btn btn-sm btn-primary px-3" onclick="ouvrirVueTaches('${project._id}', '${project.title.replace(/'/g, "\\'")}')">
                                    <i class="bi bi-folder2-open me-1"></i> Gérer
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                // Condition magique : C'est le mien -> Gauche, Je suis invité -> Droite
                if (currentUserId && ownerId && currentUserId === ownerId) {
                    gaucheContainer.insertAdjacentHTML('beforeend', cardHTML);
                    hasOwned = true;
                } else {
                    droiteContainer.insertAdjacentHTML('beforeend', cardHTML);
                    hasAssigned = true;
                }
            });

            // Gérer les cas où une des colonnes est vide
            if (!hasOwned) {
                gaucheContainer.innerHTML = '<div class="text-muted small py-3 text-center">Vous n\'avez créé aucun projet.</div>';
            }
            if (!hasAssigned) {
                droiteContainer.innerHTML = '<div class="text-muted small py-3 text-center">Aucun projet ne vous a été partagé.</div>';
            }
        }
    } catch (error) {
        console.error("Erreur lors du chargement des projets sur la page des tâches :", error);
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




// GESTION DES TÂCHES
async function loadTasks(page = 1) {
    if (!projetActuelId) return; 

    try {
        // 1. On récupère les valeurs de vos filtres HTML
        const searchVal = document.getElementById('searchInput').value.toLowerCase();
        const statusVal = document.getElementById('filterStatus').value;
        const priorityVal = document.getElementById('filterPriority').value;
        const memberVal = document.getElementById('filterMember').value;

        // On garde l'appel API tel quel au cas où le backend l'utiliserait un jour
        const query = new URLSearchParams();
        query.append('page', page);
        query.append('limit', 6);
        if (searchVal) query.append('search', searchVal);
        if (statusVal) query.append('status', statusVal);
        if (priorityVal) query.append('priority', priorityVal);
        if (memberVal) query.append('assignedTo', memberVal);

        const url = `${BASE_URL}/project/${projetActuelId}?${query}`;
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });

        let rawTasks = res.data.data || (Array.isArray(res.data) ? res.data : []);

        // 2. LE FILTRAGE JAVASCRIPT (La solution miracle)
        // On filtre manuellement le tableau en fonction des champs remplis
        rawTasks = rawTasks.filter(task => {
            const title = (task.title || '').toLowerCase();
            const desc = (task.description || '').toLowerCase();
            
            const matchSearch = !searchVal || title.includes(searchVal) || desc.includes(searchVal);
            const matchStatus = !statusVal || task.status === statusVal;
            const matchPriority = !priorityVal || task.priority === priorityVal;
            
            let assigneeId = null;
            if (task.assignedTo) {
                assigneeId = typeof task.assignedTo === 'object' ? (task.assignedTo._id || task.assignedTo.id) : task.assignedTo;
            }
            const matchMember = !memberVal || String(assigneeId) === String(memberVal);

            return matchSearch && matchStatus && matchPriority && matchMember;
        });

        // 3. LA PAGINATION SÉCURISÉE (qui s'adapte au nombre de tâches filtrées)
        const totalP = Math.ceil(rawTasks.length / 6) || 1;
        
        // Si on est sur la page 3 mais que le filtre ne donne qu'une page, on ramène à la page 1
        const currentP = page > totalP ? totalP : page; 
        
        const startIndex = (currentP - 1) * 6;
        const paginatedTasks = rawTasks.slice(startIndex, startIndex + 6);

        // 4. On envoie tout à l'affichage
        renderTasks(paginatedTasks);
        renderPagination(currentP, totalP);
        currentPage = currentP;

    } catch (err) {
        if (err.response?.status === 401) window.location.href = 'login.html';
        
        const taskList = document.getElementById('taskList');
        if (taskList) {
            taskList.innerHTML = `
                <div class="empty-state col-12 bg-white rounded shadow-sm border border-danger">
                    <i class="bi bi-exclamation-circle fs-3 mb-2 d-block text-danger"></i>
                    <p class="small text-muted mb-0">Erreur de chargement des tâches.</p>
                </div>`;
        }
    }
}

function renderTasks(tasks) {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;
    
    // Vider la liste avant de la remplir
    taskList.innerHTML = '';

    if (!tasks || tasks.length === 0) {
        taskList.innerHTML = `<div class="col-12 text-muted small p-4 text-center bg-white rounded shadow-sm border">Aucune tâche dans ce projet pour l'instant.</div>`;
        return;
    }

    // 1. EXTRAIRE L'UTILISATEUR CONNECTÉ DEPUIS LE TOKEN
    let currentUserId = null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUserId = String(payload.id || payload._id || payload.userId || '').trim();
    } catch (e) {
        console.error("Erreur de lecture du token dans renderTasks", e);
    }

    // 2. EXTRAIRE LE PROPRIÉTAIRE DU PROJET
    let projectOwnerId = '';
    if (projetActuelData && projetActuelData.owner) {
        projectOwnerId = typeof projetActuelData.owner === 'object' ? 
            (projetActuelData.owner._id || projetActuelData.owner.id) : projetActuelData.owner;
    }
    projectOwnerId = String(projectOwnerId).trim();

    const isProjectOwner = (currentUserId && projectOwnerId && currentUserId === projectOwnerId);

    // 3. LE FILTRE LOGIQUE : On trie ce qu'on va afficher
    let tasksToDisplay = tasks;
    if (!isProjectOwner) {
        // Si je ne suis pas le propriétaire, je ne garde QUE les tâches qui me sont assignées
        tasksToDisplay = tasks.filter(task => {
            let assigneeId = null;
            if (task.assignedTo) {
                assigneeId = typeof task.assignedTo === 'object' ? (task.assignedTo._id || task.assignedTo.id) : task.assignedTo;
            }
            return String(assigneeId) === currentUserId;
        });
    }

    // Si après avoir filtré, il n'y a plus rien pour cet utilisateur :
    if (tasksToDisplay.length === 0) {
        taskList.innerHTML = `<div class="col-12 text-muted small p-4 text-center bg-white rounded shadow-sm border">Aucune tâche ne vous est assignée dans ce projet.</div>`;
        return;
    }

    let taskListHTML = '';

    // 4. AFFICHAGE DES CARTES EN GRILLE
    tasksToDisplay.forEach(task => {
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
                    if (option && option.value !== "") assignedEmail = option.text;
                }
            }
            if (!assignedEmail && assigneeId) assignedEmail = "Membre assigné"; 
        }

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

        if (isProjectOwner) {
            const membresList = window.membersCache || [];
            assignedNameHTML += `
                <div class="mt-2">
                    <select id="assign-${task._id}" class="form-select form-select-sm shadow-sm" onchange="assignTask('${task._id}')">
                        <option value="">-- Réassigner la tâche --</option>
                        ${membresList.map(member => `
                            <option value="${member._id || member.id}" ${String(assigneeId) === String(member._id || member.id) ? 'selected' : ''}>
                                ${member.email || member.name || member.nom}
                            </option>
                        `).join('')}
                    </select>
                </div>`;
        }

        let actionButtons = `
            <select class="form-select form-select-sm w-auto shadow-sm" style="min-width: 110px;" onchange="updateStatus('${task._id}', this.value)">
                <option value="à faire" ${task.status === 'à faire' ? 'selected' : ''}>À faire</option>
                <option value="en cours" ${task.status === 'en cours' ? 'selected' : ''}>En cours</option>
                <option value="terminé" ${task.status === 'terminé' ? 'selected' : ''}>Terminé</option>
            </select>
        `;

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

        // Ajout à la grille (col-12 col-md-6 col-xl-4)
        taskListHTML += `
            <div class="col-12 col-md-6 col-xl-4">
                <div class="card task-card shadow-sm h-100 border-0">
                    <div class="card-body p-4 d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title fw-bold mb-0" style="color: #1f2937;">${task.title}</h6>
                            <span class="badge ${priorityClass} text-white ms-2">${task.priority}</span>
                        </div>
                        ${descriptionText}
                        <span class="badge ${statusClass} text-white mb-3 align-self-start">${task.status}</span>
                        
                        <div class="mt-auto">
                            ${assignedNameHTML}
                            <div class="d-flex gap-2 mt-3 align-items-center flex-wrap">
                                ${actionButtons}
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    });

    taskList.innerHTML = taskListHTML;
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
        const taskData = {
            title: title,
            description: description,
            priority: priority,
            status: status,
            project: projetActuelId // Le plus important : lier au projet actuel !
        };
        
        if (assignedTo) {
            taskData.assignedTo = assignedTo;
        }

        // Envoi de la requête
        await axios.post(BASE_URL, taskData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Fermer la modale
        const modalEl = document.getElementById('addTaskModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        // Réinitialiser le formulaire
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskPriority').value = '';
        document.getElementById('taskStatus').value = '';
        document.getElementById('taskAssignedTo').value = '';

        // Recharger les tâches
        loadTasks(1);

    } catch (err) {
        console.error("Erreur lors de l'ajout de la tâche :", err);
        errorDiv.textContent = "Erreur lors de l'ajout de la tâche. Vérifiez la console.";
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