// 1. INITIALISATION
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

// Récupération de ton ID depuis le token
let MON_ID = null;
try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    MON_ID = payload.id || payload._id || payload.userId;
} catch (e) {
    console.error("Erreur de lecture du token");
}

const form = document.getElementById('projectForm');
const editForm = document.getElementById('editProjectForm');
let bsEditModal = null;

// Gestion des états de pagination locale
let pageMesProjets = 1;
let pageProjetsPartages = 1;
const LIMIT_PAR_PAGE = 6; // Nombre maximum de projets affichés par page simultanément

// 2. CHARGEMENT AU DÉMARRAGE
document.addEventListener('DOMContentLoaded', () => {
    chargerLesProjets();
    
    // Initialisation du modal Bootstrap d'édition
    const modalEl = document.getElementById('editProjectModal');
    if (modalEl) {
        bsEditModal = new bootstrap.Modal(modalEl);
    }
});

async function chargerLesProjets() {
    try {
        // Envoi des query params de pagination à ton API REST comme demandé par le sujet
        const response = await fetch(`https://taskflow-backend.onrender.com/api/projects?limit=100`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const result = await response.json();
            
            // Extraction sécurisée du tableau de projets
            let rawProjects = [];
            if (Array.isArray(result)) rawProjects = result;
            else if (result.data && Array.isArray(result.data)) rawProjects = result.data;
            else if (result.projects && Array.isArray(result.projects)) rawProjects = result.projects;

            // Tri par ID décroissant ou date de création pour s'assurer que le plus récent est TOUJOURS en haut
            rawProjects.sort((a, b) => {
                const idA = a._id || a.id || '';
                const idB = b._id || b.id || '';
                return idB.localeCompare(idA);
            });
            
            // On sépare d'abord tous les projets par type
            const mesProjetsGlobaux = [];
            const projetsPartagesGlobaux = [];

            rawProjects.forEach(project => {
                const ownerId = project.owner ? (project.owner._id || project.owner) : null;
                if (String(ownerId) === String(MON_ID)) {
                    mesProjetsGlobaux.push(project);
                } else {
                    projetsPartagesGlobaux.push(project);
                }
            });

            // Rendu de la colonne "Mes Projets" avec sa pagination dédiée
            afficherColonnePaginee('mesProjetsList', 'mesProjetsPagination', mesProjetsGlobaux, pageMesProjets, true);
            
            // Rendu de la colonne "Projets Assignés" avec sa pagination dédiée
            afficherColonnePaginee('projetsPartagesList', 'projetsPartagesPagination', projetsPartagesGlobaux, pageProjetsPartages, false);
        }
    } catch (error) {
        console.error("Erreur lors du chargement des projets :", error);
    }
}

// Fonction de découpage et de rendu des projets paginés
function afficherColonnePaginee(containerId, paginationId, itemsArray, currentPage, isOwner) {
    const container = document.getElementById(containerId);
    const paginationContainer = document.getElementById(paginationId);
    if (!container || !paginationContainer) return;

    container.innerHTML = '';
    paginationContainer.innerHTML = '';

    const totalItems = itemsArray.length;
    const totalPages = Math.ceil(totalItems / LIMIT_PAR_PAGE) || 1;

    // Protection si la page courante dépasse suite à une suppression
    if (currentPage > totalPages) {
        currentPage = totalPages;
        if (isOwner) pageMesProjets = totalPages; else pageProjetsPartages = totalPages;
    }

    // Extraction des éléments de la page actuelle
    const indexDebut = (currentPage - 1) * LIMIT_PAR_PAGE;
    const indexFin = indexDebut + LIMIT_PAR_PAGE;
    const itemsPage = itemsArray.slice(indexDebut, indexFin);

    if (itemsPage.length === 0) {
        container.innerHTML = `<div class="text-muted small text-center my-4 w-100">Aucun projet à afficher.</div>`;
        return;
    }

    // Injection des cartes projets
    itemsPage.forEach(project => {
        const ownerName = project.owner ? (project.owner.name || project.owner.nom || 'Quelqu\'un') : 'Inconnu';
        ajouterProjetALaVue(containerId, project, isOwner, ownerName);
    });

    // Rendu de la barre de navigation de pagination (Précédent / Indicateur / Suivant)
    paginationContainer.innerHTML = `
        <button class="btn btn-light btn-sm border fw-semibold px-3" ${currentPage === 1 ? 'disabled' : ''} 
            onclick="changerPageColonne(${isOwner}, ${currentPage - 1})">
            <i class="bi bi-arrow-left me-1"></i> Précédent
        </button>
        <span class="text-muted small fw-medium">Page ${currentPage} sur ${totalPages}</span>
        <button class="btn btn-light btn-sm border fw-semibold px-3" ${currentPage === totalPages ? 'disabled' : ''} 
            onclick="changerPageColonne(${isOwner}, ${currentPage + 1})">
            Suivant <i class="bi bi-arrow-right ms-1"></i>
        </button>
    `;
}

// Action de changement de page globale appelée par les boutons
window.changerPageColonne = function(isOwner, nouvellePage) {
    if (isOwner) {
        pageMesProjets = nouvellePage;
    } else {
        pageProjetsPartages = nouvellePage;
    }
    chargerLesProjets();
};

// 3. CRÉATION D'UN PROJET
form.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const deadline = document.getElementById('deadline').value;

    if (title.trim() === "") return;

    try {
        const response = await fetch('https://taskflow-backend.onrender.com/api/projects',  {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description, deadline })
        });

        if (response.ok) {
            form.reset(); 
            pageMesProjets = 1; // Renvoie l'utilisateur à la première page pour voir sa création immédiatement
            chargerLesProjets(); 
        } else {
            const errorData = await response.json();
            alert("Erreur lors de la création : " + (errorData.error || errorData.message || "inconnue"));
        }
    } catch (error) {
        console.error("❌ Erreur fatale :", error);
    }
});

// 4. DESSINER LE PROJET À L'ÉCRAN (COMPACT MODERN FOLDER LOOK)
function ajouterProjetALaVue(containerId, project, isOwner, ownerName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const div = document.createElement('div');
    div.className = "modern-folder-item shadow-sm"; 
    
    const dateAffichee = project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Non défini';
    const assigneParText = !isOwner ? `
        <div class="text-truncate mb-1" style="max-width: 100%;">
            <small class="text-muted" style="font-size: 0.72rem;">
                <i class="bi bi-person-fill"></i> Par : <strong class="text-dark">${ownerName}</strong>
            </small>
        </div>` : '';

    // Compact layout tracking the file-folder design
    div.innerHTML = `
        <div>
            <div class="d-flex align-items-center mb-1">
                <i class="bi bi-folder-fill text-warning me-2 fs-5"></i>
                <h5 class="text-dark fw-bold mb-0 text-truncate" style="font-size: 0.9rem;" title="${project.title}">
                    ${project.title}
                </h5>
            </div>
            
            ${assigneParText}
            
            <p class="text-muted small mb-0 text-truncate" style="font-size: 0.75rem; max-width: 100%;" title="${project.description || ''}">
                ${project.description || 'Pas de description'}
            </p>
        </div>

        <div>
            <div class="mb-2 mt-2">
                <span class="text-secondary d-inline-block text-truncate" style="font-size: 0.7rem; max-width: 100%;">
                    <i class="bi bi-calendar-event"></i> Délai : ${dateAffichee}
                </span>
            </div>
            
            <div class="d-flex gap-1 align-items-center pt-2 border-top border-light" id="actions-zone-${project._id}">
                <a href="tasks.html?id=${project._id}" class="btn text-white btn-sm px-2 py-1 fw-semibold" 
                    style="font-size: 0.7rem; background-color: #8c2fe9; border-radius: 6px;">
                    <i class="bi bi-list-task"></i> Tâches
                </a>
                <a href="members.html?id=${project._id}" class="btn btn-light btn-sm px-2 py-1 fw-semibold border" 
                    style="font-size: 0.7rem; border-radius: 6px; color: #4b5563;">
                    <i class="bi bi-people"></i> Membres
                </a>
            </div>
        </div>
    `;

    container.appendChild(div);

    // Administrative modification buttons injection (Only if owned and on the left container)
    if (isOwner && containerId === 'mesProjetsList') {
        const actionsZone = div.querySelector(`#actions-zone-${project._id}`);
        
        const adminGroup = document.createElement('div');
        adminGroup.className = "d-flex gap-1 ms-auto";

        // Edit button setup
        const editBtn = document.createElement('button');
        editBtn.className = "btn btn-outline-secondary btn-sm px-1.5 py-0.5";
        editBtn.style.fontSize = "0.7rem";
        editBtn.style.borderRadius = "6px";
        editBtn.title = "Modifier";
        editBtn.innerHTML = `<i class="bi bi-pencil"></i>`;
        
        editBtn.addEventListener('click', () => {
            const rawDate = project.deadline ? project.deadline.split('T')[0] : '';
            window.ouvrirModalModification(project._id, project.title, project.description || '', rawDate);
        });

        // Delete button setup
        const deleteBtn = document.createElement('button');
        deleteBtn.className = "btn btn-outline-danger btn-sm px-1.5 py-0.5";
        deleteBtn.style.fontSize = "0.7rem";
        deleteBtn.style.borderRadius = "6px";
        deleteBtn.title = "Supprimer";
        deleteBtn.innerHTML = `<i class="bi bi-trash"></i>`;
        
        deleteBtn.addEventListener('click', function() {
            window.supprimerProjet(project._id, this);
        });

        adminGroup.appendChild(editBtn);
        adminGroup.appendChild(deleteBtn);
        actionsZone.appendChild(adminGroup);
    }
}

// 5. SUPPRIMER UN PROJET
window.supprimerProjet = async function(id, btnElement) {
    const cardContainer = btnElement.closest('.p-4');
    if (cardContainer && cardContainer.innerHTML.includes("PROJETS PARTAGÉS")) {
        alert("Action interdite : Vous ne pouvez pas supprimer un projet qui vous a été assigné.");
        return;
    }

    if (!confirm("Voulez-vous vraiment supprimer ce projet ?")) return;

    try {
        const response = await fetch(`https://taskflow-backend.onrender.com/api/projects/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            chargerLesProjets(); 
        } else {
            alert("Erreur ou permission refusée par le serveur.");
        }
    } catch (err) {
        console.error("Erreur de suppression:", err);
    }
};

// 6. MODIFIER UN PROJET
window.ouvrirModalModification = function(id, title, description, deadline) {
    const inputId = document.getElementById('editProjectId');
    const inputTitle = document.getElementById('editTitle');
    const inputDesc = document.getElementById('editDescription');
    const inputDeadline = document.getElementById('editDeadline');

    if (inputId && inputTitle && inputDesc && inputDeadline) {
        inputId.value = id;
        inputTitle.value = title;
        inputDesc.value = description;
        inputDeadline.value = deadline;
        
        if (bsEditModal) {
            bsEditModal.show();
        } else {
            console.error("Le modal Bootstrap n'est pas initialisé.");
        }
    } else {
        console.error("Champs du modal de modification introuvables dans le HTML.");
    }
};

if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('editProjectId').value;
        const title = document.getElementById('editTitle').value;
        const description = document.getElementById('editDescription').value;
        const deadline = document.getElementById('editDeadline').value;

        // Visual Validation Guard: Ensure the ID exists before sending
        if (!id) {
            alert("Erreur: L'identifiant du projet est manquant. Veuillez rafraîchir la page.");
            return;
        }

        try {
            const response = await fetch(`https://taskflow-backend.onrender.com/api/projects/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, description, deadline })
            });

            // Check if the server returned HTML instead of JSON
            const contentType = response.headers.get("content-type");
            
            if (response.ok) {
                if (bsEditModal) bsEditModal.hide();
                chargerLesProjets(); 
            } else {
                // If the response is JSON, parse it normally. Otherwise, read as raw text.
                if (contentType && contentType.includes("application/json")) {
                    const errData = await response.json();
                    alert("Erreur de mise à jour: " + (errData.error || errData.message || "Serveur bloqué"));
                } else {
                    const rawHtmlError = await response.text();
                    console.error("Le serveur a renvoyé une page HTML d'erreur :", rawHtmlError);
                    alert(`Erreur Serveur (${response.status}) : Route introuvable ou crash backend. Vérifiez la console.`);
                }
            }
        } catch (err) {
            console.error("Erreur de modification du projet:", err);
        }
    });
}