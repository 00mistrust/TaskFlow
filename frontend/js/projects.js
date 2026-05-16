// Afficher les projets dès le chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:5000/api/projects', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const result = await response.json();
            const projects = result.data || [];
            
            // On vide la liste avant de la remplir pour éviter les doublons
            listeUl.innerHTML = ''; 
            
            projects.forEach(project => {
                ajouterProjetALaVue(project._id, project.title, project.description, project.deadline);
            });
        }
    } catch (error) {
        console.error("Erreur lors du chargement des projets :", error);
    }
});
const token = localStorage.getItem('token');
const form = document.getElementById('projectForm');
const listeUl = document.getElementById('listeProjets'); 

// 1. GESTION DE LA SOUMISSION DU FORMULAIRE
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Récupération des inputs
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
            // MAGIE ICI : On extrait la réponse JSON du backend pour récupérer le VRAI _id généré !
            const newProject = await response.json(); 
            
            // On envoie le vrai _id, et les autres infos à la fonction d'affichage
            ajouterProjetALaVue(newProject._id, newProject.title, newProject.description, newProject.deadline);
            
            form.reset(); 
        } else {
            alert("Erreur lors de la création du projet.");
        }
    } catch (error) {
        console.log("Le backend n'a pas répondu, ajout manuel pour tester visuellement.");
        // Pour les tests sans backend : on génère un faux ID pour que les boutons marchent quand même
        ajouterProjetALaVue('id-temporaire', title, description, deadline);
        
    }
});

// 2. FONCTION POUR DESSINER LE PROJET À L'ÉCRAN
function ajouterProjetALaVue(id, title, desc, date) {
    const li = document.createElement('li');
    li.className = "list-group-item d-flex justify-content-between align-items-center mb-2 shadow-sm p-3";

    // Formatage de la date (pour faire plus propre)
    const dateAffichee = date ? new Date(date).toLocaleDateString() : 'Non défini';

    li.innerHTML = `
        <div style="display: flex; flex-grow: 1; align-items: center; gap: 30px;">
            <div style="min-width: 150px;">
                <strong>Nom projet :</strong> <span class="text-primary">${title}</span>
            </div>
            <div style="min-width: 250px; flex-grow: 1;">
                <strong>Description :</strong> <span class="text-muted">${desc || '---'}</span>
            </div>
            <div style="min-width: 180px;">
                <strong>Delay :</strong> <span>${dateAffichee}</span>
            </div>
        </div>
        <div>
            <a href="tasks.html?id=${id}" class="btn btn-outline-primary btn-sm ms-2">
                <i class="bi bi-list-task"></i> Tâches
            </a>
            <a href="members.html?id=${id}" class="btn btn-outline-secondary btn-sm ms-2">
                <i class="bi bi-people"></i> Membres
            </a>
            <button class="btn btn-outline-danger btn-sm ms-2" onclick="supprimerProjet('${id}', this)">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;

    listeUl.appendChild(li);
}

// 3. FONCTION POUR SUPPRIMER UN PROJET (Bouton Poubelle)
window.supprimerProjet = async function(id, btnElement) {
    if (!confirm("Voulez-vous vraiment supprimer ce projet ?")) return;

    try {
        // Envoi de la requête de suppression au backend
        const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // Même si on a pas encore codé la route DELETE backend, on le supprime de l'écran pour l'utilisateur
        const liItem = btnElement.closest('li'); 
        if (liItem) {
            liItem.remove();
        }
    } catch (err) {
        console.error("Erreur de suppression:", err);
    }
};