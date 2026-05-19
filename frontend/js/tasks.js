// js/tasks.js
const BASE_URL = 'http://localhost:5000/api/tasks';
const token = localStorage.getItem('token');
let currentPage = 1;
let pageProjetsGauche = 1;
let pageProjetsDroite = 1;
const LIMIT_PROJETS = 6;

if (!token) window.location.href = 'login.html';

const user = JSON.parse(localStorage.getItem('user') || '{}');
if (user.name || user.nom) document.getElementById('userName').textContent = user.name || user.nom;

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

// VARIABLES DE VUES ET PROJET ACTUEL
const btnNouvelleTache = document.querySelector('[data-bs-target="#addTaskModal"]');
const vueProjets = document.getElementById('vueProjets');
const vueTaches = document.getElementById('vueTaches');
const grilleProjets = document.getElementById('grilleProjets');
const btnRetourProjets = document.getElementById('btnRetourProjets');

// VARIABLES DU PROJET ACTUEL ET LECTURE DE L'URL
const urlParams = new URLSearchParams(window.location.search);
let projetActuelId = urlParams.get('id'); 
let projetActuelData = null; 
let brouillonEnAttente = null; // Mémoire tampon pour le bandeau vert

console.log("ID du projet récupéré dans l'URL :", projetActuelId);

// GESTION DU BOUTON RETOUR
if (btnRetourProjets) {
    btnRetourProjets.addEventListener('click', () => {
        projetActuelId = null; 
        projetActuelData = null;
        window.history.pushState({}, document.title, window.location.pathname);
        vueTaches.classList.add('d-none');
        vueProjets.classList.remove('d-none');
        chargerProjetsPourTaches(); 
    });
}

// INITIALISATION AU CHARGEMENT DE LA PAGE
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id') || params.get('projectId');
    if (projetActuelId) {
        vueProjets.classList.add('d-none');
        vueTaches.classList.remove('d-none');
        
        loadMembers().then(() => {
            if(projetActuelData && projetActuelData.title) {
                titreProjetActuel.innerHTML = `Tâches :  <strong style="color: #ffc402e0; ">${projetActuelData.title}</strong>`;
            }
            loadTasks(1);
        });
    } else {
        vueTaches.classList.add('d-none');
        vueProjets.classList.remove('d-none');
        chargerProjetsPourTaches();
    }
});

async function chargerProjetsPourTaches() {
    if (!grilleProjets) return;

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
            const allProjects = result.data || result || [];

            const gaucheContainer = document.getElementById('grilleProjets'); 
            const droiteContainer = document.getElementById('mesTachesAssigneesList'); 

            gaucheContainer.innerHTML = '';
            droiteContainer.innerHTML = '';

            const ownedProjects = [];
            const sharedProjects = [];

            allProjects.forEach(project => {
                let ownerId = project.owner ? (typeof project.owner === 'object' ? (project.owner._id || project.owner.id) : project.owner) : '';
                ownerId = String(ownerId).trim();

                if (currentUserId && ownerId && currentUserId === ownerId) {
                    ownedProjects.push(project);
                } else {
                    sharedProjects.push(project);
                }
            });

            // --- PAGINATION FOR LEFT PANEL (OWNED) ---
            const totalPagesGauche = Math.ceil(ownedProjects.length / LIMIT_PROJETS) || 1;
            const startGauche = (pageProjetsGauche - 1) * LIMIT_PROJETS;
            const paginatedOwned = ownedProjects.slice(startGauche, startGauche + LIMIT_PROJETS);

            if (paginatedOwned.length === 0 && ownedProjects.length > 0) {
                pageProjetsGauche = 1;
                chargerProjetsPourTaches();
                return;
            }

            if (paginatedOwned.length === 0) {
                gaucheContainer.innerHTML = '<div class="text-muted small py-3 text-center">Vous n\'avez créé aucun projet.</div>';
            } else {
                paginatedOwned.forEach(project => {
                    gaucheContainer.insertAdjacentHTML('beforeend', générerHTMLDossier(project, currentUserId));
                });
            }
            générerPaginationPanel('paginationProjetsGauche', pageProjetsGauche, totalPagesGauche, 'changerPageGauche');

            // --- PAGINATION FOR RIGHT PANEL (SHARED) ---
            const totalPagesDroite = Math.ceil(sharedProjects.length / LIMIT_PROJETS) || 1;
            const startDroite = (pageProjetsDroite - 1) * LIMIT_PROJETS;
            const paginatedShared = sharedProjects.slice(startDroite, startDroite + LIMIT_PROJETS);

            if (paginatedShared.length === 0 && sharedProjects.length > 0) {
                pageProjetsDroite = 1;
                chargerProjetsPourTaches();
                return;
            }

            if (paginatedShared.length === 0) {
                droiteContainer.innerHTML = '<div class="text-muted small py-3 text-center">Aucun projet ne vous a été partagé.</div>';
            } else {
                paginatedShared.forEach(project => {
                    droiteContainer.insertAdjacentHTML('beforeend', générerHTMLDossier(project, currentUserId));
                });
            }
            générerPaginationPanel('paginationProjetsDroite', pageProjetsDroite, totalPagesDroite, 'changerPageDroite');
        }
    } catch (error) {
        console.error("Erreur lors du chargement des projets sur la page des tâches :", error);
    }
}

function générerHTMLDossier(project, currentUserId) {
    const safeTitle = project.title.replace(/'/g, "\\'");
    const projectTitle = project.title || 'Sans titre';

    return `
        <div class="modern-folder-item shadow-sm" onclick="ouvrirVueTaches('${project._id}', '${safeTitle}')">
            <div class="folder-icon-large">
                <i class="bi bi-folder-fill"></i>
            </div>
            <h4 class="folder-title-bold" title="${projectTitle}">
                ${projectTitle}
            </h4>
            <p class="folder-click-hint">
                Cliquez pour gérer les tâches
            </p>
        </div>
    `;
}

// Render utility for panels pagination
// Render utility for panels pagination
function générerPaginationPanel(containerId, currentPage, totalPages, handlerName) {
    const div = document.getElementById(containerId);
    if (!div) return;
    if (totalPages <= 1) {
        div.innerHTML = '';
        return;
    }
    div.innerHTML = `
        <button class="btn btn-sm btn-outline-secondary pagination-btn" onclick="${handlerName}(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>
            <i class="bi bi-chevron-left"></i>
        </button>
        <span class="text-muted small mx-2">Page ${currentPage} / ${totalPages}</span>
        <button class="btn btn-sm btn-outline-secondary pagination-btn" onclick="${handlerName}(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>
            <i class="bi bi-chevron-right"></i>
        </button>
    `;
}

window.changerPageGauche = function(newPage) {
    pageProjetsGauche = newPage;
    chargerProjetsPourTaches();
}

window.changerPageDroite = function(newPage) {
    pageProjetsDroite = newPage;
    chargerProjetsPourTaches();
}

function ouvrirVueTaches(projectId, projectTitle) {
    // Add this inside your project-loading function in js/tasks.js
    history.pushState(null, '', `tasks.html?id=${projectId}`);
    projetActuelId = projectId; 
    titreProjetActuel.innerHTML = `<small>Projet</small> : <strong style="color: #ffc402e0; ">${projectTitle}</strong>`;
    
    vueProjets.classList.add('d-none');
    vueTaches.classList.remove('d-none');

    loadMembers().then(() => {
        loadTasks(1);
    });
}

// GESTION DES TÂCHES
async function loadTasks(page = 1) {
    if (!projetActuelId) return; 

    try {
        let searchVal = document.getElementById('searchInput')?.value.toLowerCase() || '';
        let statusVal = document.getElementById('filterStatus')?.value || '';
        let priorityVal = document.getElementById('filterPriority')?.value || '';
        let memberVal = document.getElementById('filterMember')?.value || '';

        if (statusVal.toLowerCase() === 'tous' || statusVal === 'all') statusVal = '';
        if (priorityVal.toLowerCase() === 'tous' || priorityVal === 'all') priorityVal = '';
        if (memberVal.toLowerCase() === 'tous' || memberVal === 'all') memberVal = '';

        const query = new URLSearchParams();
        query.append('page', page); 
        query.append('limit', 6); 

        if (searchVal) query.append('search', searchVal);
        if (statusVal) query.append('status', statusVal);
        if (priorityVal) query.append('priority', priorityVal);
        if (memberVal) query.append('assignedTo', memberVal);

        const url = `${BASE_URL}/project/${projetActuelId}?${query}`;
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });

        let tasksToShow = res.data.data || (Array.isArray(res.data) ? res.data : []);

        const totalP = res.data.totalPages || 1;
        const currentP = page; 

        renderTasks(tasksToShow);
        renderPagination(currentP, totalP);
        currentPage = currentP;

    } catch (err) {
        console.error("Erreur loadTasks :", err);
    }
}

function renderTasks(tasks) {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;
    
    taskList.innerHTML = '';

    if (!tasks || tasks.length === 0) {
        taskList.innerHTML = `<div class="col-12 text-muted small p-4 text-center bg-white rounded shadow-sm border">Aucune tâche dans ce projet pour l'instant.</div>`;
        return;
    }

    let currentUserId = null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUserId = String(payload.id || payload._id || payload.userId || '').trim();
    } catch (e) {
        console.error("Erreur de lecture du token dans renderTasks", e);
    }

    let projectOwnerId = '';
    if (projetActuelData && projetActuelData.owner) {
        projectOwnerId = typeof projetActuelData.owner === 'object' ? 
            (projetActuelData.owner._id || projetActuelData.owner.id) : projetActuelData.owner;
    }
    projectOwnerId = String(projectOwnerId).trim();

    const isProjectOwner = (currentUserId && projectOwnerId && currentUserId === projectOwnerId);
    
    let tasksToDisplay = tasks;

    let taskListHTML = '';

    tasksToDisplay.forEach(task => {
        const priorityClass = { 'haute': 'badge-priority-haute', 'moyenne': 'badge-priority-moyenne', 'basse': 'badge-priority-basse' }[task.priority] || 'bg-secondary';
        const statusClass = { 'à faire': 'badge-status-afaire', 'en cours': 'badge-status-encours', 'terminé': 'badge-status-termine' }[task.status] || 'bg-secondary';
        const descriptionText = task.description ? `<p class="card-text small text-muted mb-3">${task.description}</p>` : '';
        const descEscaped = (task.description || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        const dateFormatee = task.dueDate 
            ? new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) 
            : 'Pas de date';

        const dateEcheance = task.dueDate ? new Date(task.dueDate) : null;
        const aujourdhui = new Date();
        aujourdhui.setHours(0,0,0,0); 
        if (dateEcheance) dateEcheance.setHours(0,0,0,0);

        const estEnRetard = task.status !== 'terminé' && dateEcheance && dateEcheance < aujourdhui;
        const classeCouleurDate = estEnRetard ? 'text-danger fw-bold' : 'text-muted';

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
            const taskDueDateStr = task.dueDate ? task.dueDate.substring(0, 10) : '';

            actionButtons += `
                <button class="btn btn-outline-primary btn-sm ms-auto shadow-sm" onclick="openEdit('${task._id}', '${task.title.replace(/'/g, "\\'")}', '${descEscaped}', '${task.priority}', '${task.status}', '${taskDueDateStr}')" title="Modifier">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger btn-sm shadow-sm" onclick="deleteTask('${task._id}')" title="Supprimer">
                    <i class="bi bi-trash"></i>
                </button>
            `;
        }

        taskListHTML += `
            <div class="col-12 col-md-6 col-xl-4">
                <div class="card task-card shadow-sm h-100 border-0">
                    <div class="card-body p-4 d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title fw-bold mb-0" style="color: #1f2937;">${task.title}</h6>
                            <span class="badge ${priorityClass} text-white ms-2">${task.priority}</span>
                        </div>
                        ${descriptionText}
                        
                        <div class="d-flex gap-2 align-items-center mb-3">
                            <span class="badge ${statusClass} text-white">${task.status}</span>
                            
                            <span class="small ms-auto ${classeCouleurDate}" title="${estEnRetard ? 'Cette tâche est en retard !' : 'Date d\'échéance'}">
                                <i class="bi bi-calendar3 me-1"></i> ${dateFormatee}
                            </span>
                        </div>
                        
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
    if (!div) return; 

    const safeTotalPages = totalPages > 0 ? totalPages : 1;
    const safePage = page > 0 ? page : 1;

    div.innerHTML = `
        <button class="btn btn-sm btn-outline-secondary pagination-btn" onclick="loadTasks(${safePage - 1})" ${safePage <= 1 ? 'disabled' : ''}>
            <i class="bi bi-chevron-left"></i> Précédent
        </button>
        <span class="text-muted small mx-3">Page ${safePage} / ${safeTotalPages}</span>
        <button class="btn btn-sm btn-outline-secondary pagination-btn" onclick="loadTasks(${safePage + 1})" ${safePage >= safeTotalPages ? 'disabled' : ''}>
            Suivant <i class="bi bi-chevron-right"></i>
        </button>`;
}

async function addTask() {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;
    const assignedTo = document.getElementById('taskAssignedTo').value;
    const dueDate = document.getElementById('taskDueDate').value || null;

    if (!title || !priority || !status) {
        const errorDiv = document.getElementById('formError');
        if (errorDiv) {
            errorDiv.textContent = "Veuillez remplir tous les champs obligatoires (*).";
            errorDiv.classList.remove('d-none');
        }
        return;
    }

    try {
        await axios.post(BASE_URL, {
            title,
            description,
            priority,
            status,
            assignedTo,
            dueDate, 
            project: projetActuelId
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        window.supprimerBrouillon();

        const modalEl = document.getElementById('addTaskModal');
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();
        
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskPriority').value = '';
        document.getElementById('taskStatus').value = '';
        document.getElementById('taskAssignedTo').value = '';
        document.getElementById('taskDueDate').value = '';
        if (document.getElementById('formError')) document.getElementById('formError').classList.add('d-none');

        loadTasks(currentPage);
    } catch (err) {
        console.error(err);
    }
}

function openEdit(id, title, description, priority, status, dueDate) { 
    document.getElementById('editTaskId').value = id;
    document.getElementById('editTaskTitle').value = title;
    document.getElementById('editTaskDescription').value = description;
    document.getElementById('editTaskPriority').value = priority;
    document.getElementById('editTaskStatus').value = status;
    document.getElementById('editTaskDueDate').value = dueDate || ''; 
    document.getElementById('editFormError').classList.add('d-none');
    new bootstrap.Modal(document.getElementById('editTaskModal')).show();
}

async function saveEdit() {
    const id = document.getElementById('editTaskId').value;
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDescription').value;
    const priority = document.getElementById('editTaskPriority').value;
    const status = document.getElementById('editTaskStatus').value;
    const dueDate = document.getElementById('editTaskDueDate').value || null; 
    const errorDiv = document.getElementById('editFormError');

    if (!title) {
        errorDiv.textContent = 'Le titre est obligatoire.';
        errorDiv.classList.remove('d-none');
        return;
    }
    errorDiv.classList.add('d-none');

    try {
        await axios.put(`${BASE_URL}/${id}`, {
            title, description, priority, status, dueDate 
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
        window.membersCache = projetActuelData.members || [];
        
        let currentUserId = null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUserId = String(payload.id || payload._id || payload.userId || '').trim();
        } catch (e) {
            console.error("Erreur de lecture du token dans tasks.js", e);
        }
        
        let projectOwnerId = '';
        if (projetActuelData && projetActuelData.owner) {
            if (typeof projetActuelData.owner === 'object') {
                projectOwnerId = projetActuelData.owner._id || projetActuelData.owner.id || '';
            } else {
                projectOwnerId = projetActuelData.owner;
            }
        }
        projectOwnerId = String(projectOwnerId).trim();

        const isProjectOwner = (currentUserId && projectOwnerId && currentUserId === projectOwnerId);

        if (btnNouvelleTache) {
            if (isProjectOwner) {
                btnNouvelleTache.classList.remove('d-none');
            } else {
                btnNouvelleTache.classList.add('d-none');
            }
        }

        const filterSelect = document.getElementById('filterMember');
        if (filterSelect) filterSelect.innerHTML = '<option value="">Tous les membres</option>';
        
        const assignSelect = document.getElementById('taskAssignedTo');
        if (assignSelect) assignSelect.innerHTML = '<option value="">-- Non assigné --</option>';

        window.membersCache.forEach(member => {
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

// MANAGEMENT DU MODAL ADDTASK AVEC RESET INTEGRAL ET DETECTEUR DE BROUILLON VISUEL
const modalEl = document.getElementById('addTaskModal');
if (modalEl) {
    modalEl.addEventListener('show.bs.modal', () => {
        // Formulaire vierge à chaque ouverture
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskPriority').value = '';
        document.getElementById('taskStatus').value = '';
        document.getElementById('taskAssignedTo').value = '';
        document.getElementById('taskDueDate').value = '';
        
        const alertDiv = document.getElementById('draftAlert');
        if (alertDiv) alertDiv.classList.add('d-none');

        if (!projetActuelId) return;
        const dataSauvegardee = localStorage.getItem(`brouillon_projet_${projetActuelId}`);
        
        if (dataSauvegardee) {
            const brouillon = JSON.parse(dataSauvegardee);
            if (brouillon.title || brouillon.description) {
                brouillonEnAttente = brouillon; 
                if (alertDiv) alertDiv.classList.remove('d-none'); // Déclenchement du bandeau vert
            }
        }
    });
}

window.restaurerLeBrouillonVisuellement = function() {
    if (!brouillonEnAttente) return;

    document.getElementById('taskTitle').value = brouillonEnAttente.title || '';
    document.getElementById('taskDescription').value = brouillonEnAttente.description || '';
    document.getElementById('taskPriority').value = brouillonEnAttente.priority || '';
    document.getElementById('taskStatus').value = brouillonEnAttente.status || '';
    document.getElementById('taskAssignedTo').value = brouillonEnAttente.assignedTo || '';
    document.getElementById('taskDueDate').value = brouillonEnAttente.dueDate || '';

    const alertDiv = document.getElementById('draftAlert');
    if (alertDiv) alertDiv.classList.add('d-none');
    
    brouillonEnAttente = null; 
};
window.masquerBandeauBrouillon = function() {
    const alertDiv = document.getElementById('draftAlert');
    if (alertDiv) alertDiv.classList.add('d-none');
    
    // On vide la mémoire tampon pour cette ouverture,
    brouillonEnAttente = null; 
};
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

async function assignTask(taskId) {
    const selectElement = document.getElementById(`assign-${taskId}`);
    if (!selectElement) return;

    const newAssigneeId = selectElement.value;

    try {
        const response = await axios.patch(
            `${BASE_URL}/${taskId}/assign`, 
            { assignedTo: newAssigneeId || null }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 200) {
            alert("Tâche réassignée avec succès !");
            loadTasks(currentPage); 
        }
    } catch (err) {
        console.error("Erreur lors de la réassignation :", err);
        alert(err.response?.data?.error || "Erreur lors de la réassignation de la tâche.");
        loadTasks(currentPage); 
    }
}

// LOGIQUE DES BROUILLONS SANS BLOCAGE NATIF CONFIRM()
window.sauvegarderBrouillon = function() {
    if (!projetActuelId) return;

    const brouillon = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        priority: document.getElementById('taskPriority').value,
        status: document.getElementById('taskStatus').value,
        assignedTo: document.getElementById('taskAssignedTo').value,
        dueDate: document.getElementById('taskDueDate').value
    };

    localStorage.setItem(`brouillon_projet_${projetActuelId}`, JSON.stringify(brouillon));
};

window.supprimerBrouillon = function() {
    if (projetActuelId) {
        localStorage.removeItem(`brouillon_projet_${projetActuelId}`);
    }
    const alertDiv = document.getElementById('draftAlert');
    if (alertDiv) alertDiv.classList.add('d-none');
    brouillonEnAttente = null;
};

// DÉMARRAGE DE LA PAGE
pollNotifications();
setInterval(pollNotifications, 30000);
window.assignTask = assignTask;
chargerProjetsPourTaches();