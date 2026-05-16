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

// 2. CHARGEMENT AU DÉMARRAGE
document.addEventListener('DOMContentLoaded', () => {
    chargerLesProjets();
    // Initialisation de l'instance du modal Bootstrap
    const modalEl = document.getElementById('editProjectModal');
    if (modalEl) {
        bsEditModal = new bootstrap.Modal(modalEl);
    }
});

async function chargerLesProjets() {
    try {
        const response = await fetch('http://localhost:5000/api/projects', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const result = await response.json();
            const projects = result.data || result || [];
            
            // On vide les deux colonnes
            document.getElementById('mesProjetsList').innerHTML = '';
            document.getElementById('projetsPartagesList').innerHTML = '';
            
            projects.forEach(project => {
                const ownerId = project.owner ? (project.owner._id || project.owner) : null;
                const ownerName = project.owner ? (project.owner.name || project.owner.nom || 'Quelqu\'un') : 'Inconnu';
                
                // Si je suis le créateur -> Colonne de gauche
                if (String(ownerId) === String(MON_ID)) {
                    ajouterProjetALaVue('mesProjetsList', project, true, ownerName);
                } 
                // Si je suis invité -> Colonne de droite
                else {
                    ajouterProjetALaVue('projetsPartagesList', project, false, ownerName);
                }
            });
        }
    } catch (error) {
        console.error("Erreur lors du chargement des projets :", error);
    }
}

// 3. CRÉATION D'UN PROJET
form.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    console.log("🚀 Bouton cliqué ! Début de la création...");

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
    div.className = "card shadow-sm border-0 mb-1"; 
    
    const dateAffichee = project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Non défini';
    const assigneParText = !isOwner ? `<small class="text-muted"><i class="bi bi-person-fill"></i> Assigné par : <strong>${ownerName}</strong></small><br>` : '';

    // Boutons de modification et suppression combinés de manière fluide pour le propriétaire
    let gestionButtonsHTML = '';
    if (isOwner) {
        // Encodage optionnel pour éviter les crashs si la description contient des guillemets doubles
        const cleanDesc = (project.description || '').replace(/"/g, '&quot;');
        const cleanTitle = (project.title || '').replace(/"/g, '&quot;');
        const rawDate = project.deadline ? project.deadline.split('T')[0] : '';

        gestionButtonsHTML = `
            <div class="row g-2 mt-1">
                <div class="col-6">
                    <button class="btn btn-outline-secondary btn-sm w-100" 
                        onclick="ouvrirModalModification('${project._id}', '${cleanTitle}', '${cleanDesc}', '${rawDate}')">
                        <i class="bi bi-pencil"></i> Modifier
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-outline-danger btn-sm w-100" 
                        onclick="supprimerProjet('${project._id}', this)">
                        <i class="bi bi-trash"></i> Supprimer
                    </button>
                </div>
            </div>
        `;
    }

    div.innerHTML = `
        <div class="card-body">
            <h5 class="card-title text-primary fw-bold mb-1">${project.title}</h5>
            ${assigneParText}
            <p class="card-text text-muted mb-2">${project.description || 'Pas de description'}</p>
            <p class="card-text mb-3"><small class="text-secondary"><i class="bi bi-calendar-event"></i> Délai : ${dateAffichee}</small></p>
            
            <div class="d-flex gap-2">
                <a href="tasks.html?id=${project._id}" class="btn btn-primary btn-sm flex-grow-1">
                    <i class="bi bi-list-task"></i> Tâches
                </a>
                <a href="members.html?id=${project._id}" class="btn btn-secondary btn-sm flex-grow-1">
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
            const cardItem = btnElement.closest('.card'); 
            if (cardItem) cardItem.remove();
        } else {
            alert("Erreur ou permission refusée pour supprimer ce projet.");
        }
    } catch (err) {
        console.error("Erreur de suppression:", err);
    }
};

// 6. MODIFIER UN PROJET (GESTION INTERFACE ET FORMULAIRE)
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
            method: 'PUT', // Route REST d'édition du projet
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description, deadline })
        });

        if (response.ok) {
            if (bsEditModal) bsEditModal.hide();
            chargerLesProjets(); // Recharge la vue à jour
        } else {
            const errData = await response.json();
            alert("Erreur de mise à jour: " + (errData.error || errData.message || "Serveur bloqué"));
        }
    } catch (err) {
        console.error("Erreur de modification du projet:", err);
    }
});