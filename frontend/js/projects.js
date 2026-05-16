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
const LIMIT_PAR_PAGE = 3; // Nombre maximum de projets affichés par page simultanément

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
        const response = await fetch(`http://localhost:5000/api/projects?limit=100`, {
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
        container.innerHTML = `<p class="text-muted small text-center my-4">Aucun projet à afficher.</p>`;
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
        const response = await fetch('http://localhost:5000/api/projects',  {
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

// 4. DESSINER LE PROJET À L'ÉCRAN
function ajouterProjetALaVue(containerId, project, isOwner, ownerName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const div = document.createElement('div');
    div.className = "card shadow-sm border mt-1"; 
    div.style.borderRadius = "12px";
    div.style.backgroundColor = "#ffffff";
    
    const dateAffichee = project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Non défini';
    const assigneParText = !isOwner ? `<div class="mb-1"><small class="text-muted" style="font-size: 0.75rem;"><i class="bi bi-person-fill"></i> Assigné par : <strong class="text-dark">${ownerName}</strong></small></div>` : '';

    let gestionButtonsHTML = '';
    if (isOwner) {
        const cleanDesc = (project.description || '').replace(/"/g, '&quot;');
        const cleanTitle = (project.title || '').replace(/"/g, '&quot;');
        const rawDate = project.deadline ? project.deadline.split('T')[0] : '';

        gestionButtonsHTML = `
            <div class="row g-2 mt-1 pt-2 border-top" style="border-color: #f3f4f6 !important;">
                <div class="col-6">
                    <button class="btn btn-outline-secondary btn-sm py-1 px-2 w-100 fw-semibold" style="font-size: 0.75rem; border-radius: 6px;"
                        onclick="ouvrirModalModification('${project._id}', '${cleanTitle}', '${cleanDesc}', '${rawDate}')">
                        <i class="bi bi-pencil"></i> Modifier
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-outline-danger btn-sm py-1 px-2 w-100 fw-semibold" style="font-size: 0.75rem; border-radius: 6px;"
                        onclick="supprimerProjet('${project._id}', this)">
                        <i class="bi bi-trash"></i> Supprimer
                    </button>
                </div>
            </div>
        `;
    }

    div.innerHTML = `
        <div class="card-body p-3">
            <h5 class="card-title text-dark fw-bold mb-1 h6" style="letter-spacing: -0.3px;">${project.title}</h5>
            ${assigneParText}
            <p class="card-text text-muted mb-2 small" style="line-height: 1.4; font-size: 0.8rem">${project.description || 'Pas de description'}</p>
            <div class="mb-3"><span class="badge bg-light text-secondary border py-1 px-2" style="font-size: 0.7rem; border-radius: 6px;"><i class="bi bi-calendar-event me-1"></i>Délai : ${dateAffichee}</span></div>
            
            <div class="d-flex gap-2">
                <a href="tasks.html?id=${project._id}" class="btn text-white btn-sm py-1 px-2 flex-grow-1 fw-semibold" style="font-size: 0.75rem; background-color: #3c3489; border-radius: 6px;">
                    <i class="bi bi-list-task"></i> Tâches
                </a>
                <a href="members.html?id=${project._id}" class="btn btn-light btn-sm py-1 px-2 flex-grow-1 fw-semibold border" style="font-size: 0.75rem; border-radius: 6px; color: #4b5563;">
                    <i class="bi bi-people"></i> Membres
                </a>
            </div>
            ${gestionButtonsHTML}
        </div>
    `;

    container.appendChild(div);
}

// 5. SUPPRIMER UN PROJET
window.supprimerProjet = async function(id, btnElement) {
    if (!confirm("Voulez-vous vraiment supprimer ce projet ?")) return;

    try {
        const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            chargerLesProjets(); // Recharge la vue globale pour recalculer la pagination instantanément
        } else {
            alert("Erreur ou permission refusée pour supprimer ce projet.");
        }
    } catch (err) {
        console.error("Erreur de suppression:", err);
    }
};

// 6. MODIFIER UN PROJET
window.ouvrirModalModification = function(id, title, description, deadline) {
    document.getElementById('editProjectId').value = id;
    document.getElementById('editTitle').value = title;
    document.getElementById('editDescription').value = description;
    document.getElementById('editDeadline').value = deadline;
    
    if (bsEditModal) bsEditModal.show();
};

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('editProjectId').value;
    const title = document.getElementById('editTitle').value;
    const description = document.getElementById('editDescription').value;
    const deadline = document.getElementById('editDeadline').value;

    try {
        const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description, deadline })
        });

        if (response.ok) {
            if (bsEditModal) bsEditModal.hide();
            chargerLesProjets(); 
        } else {
            const errData = await response.json();
            alert("Erreur de mise à jour: " + (errData.error || errData.message || "Serveur bloqué"));
        }
    } catch (err) {
        console.error("Erreur de modification du projet:", err);
    }
});