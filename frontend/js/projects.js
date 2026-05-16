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

// 2. CHARGEMENT AU DÉMARRAGE
document.addEventListener('DOMContentLoaded', chargerLesProjets);

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
                if (ownerId === MON_ID) {
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
// 3. CRÉATION D'UN PROJET
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Empêche la page de se rafraîchir
    console.log("🚀 Bouton cliqué ! Début de la création...");

    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const deadline = document.getElementById('deadline').value;

    console.log("📝 Données lues :", { title, description, deadline });

    if (title.trim() === "") {
        console.log("❌ Le titre est vide, annulation.");
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/projects',  {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description, deadline })
        });

        console.log("🌐 Statut de la réponse du serveur :", response.status);

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Projet enregistré avec succès :", data);
            form.reset(); 
            chargerLesProjets(); // On rafraîchit la liste
        } else {
            const errorData = await response.json();
            console.error("❌ Le backend a refusé :", errorData);
            alert("Erreur lors de la création : " + (errorData.error || errorData.message || "inconnue"));
        }
    } catch (error) {
        console.error("❌ Erreur fatale (réseau ou code) :", error);
    }
});
// 4. DESSINER LE PROJET À L'ÉCRAN
function ajouterProjetALaVue(containerId, project, isOwner, ownerName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const div = document.createElement('div');
    div.className = "card shadow-sm border-0"; 
    
    // Formatage de la date
    const dateAffichee = project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Non défini';
    
    // Message "Assigné par..." visible uniquement pour les invités
    const assigneParText = !isOwner ? `<small class="text-muted"><i class="bi bi-person-fill"></i> Assigné par : <strong>${ownerName}</strong></small><br>` : '';

    // Bouton supprimer visible uniquement pour le propriétaire
    const btnDelete = isOwner 
        ? `<button class="btn btn-outline-danger btn-sm w-100 mt-2" onclick="supprimerProjet('${project._id}', this)"><i class="bi bi-trash"></i> Supprimer le projet</button>`
        : '';

    div.innerHTML = `
        <div class="card-body">
            <h5 class="card-title text-primary fw-bold">${project.title}</h5>
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
            ${btnDelete}
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