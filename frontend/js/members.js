const BASE_URL = 'http://localhost:5000/api/projects';
const token = localStorage.getItem('token');

//get project id from url
const params = new URLSearchParams(window.location.search);
const PROJECT_ID = params.get('id');

if (!token) {
    window.location.href = 'login.html';
}

async function loadMembers() {
    if (!PROJECT_ID) {
        document.getElementById('membersList').innerHTML = `<div class="alert alert-warning">Il faut aller vers projets , creer un projet et cliquer sur le bouton membre pour assigner un membre au projet specifique</div>`;
        return; // J'ai retiré le code cassé ici
    }
    
    try {
        const res = await axios.get(`${BASE_URL}/${PROJECT_ID}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const project = res.data.data || res.data;
        
        // 👉 C'EST ICI QUE LE TITRE DOIT S'AFFICHER !
        const titleElement = document.getElementById('projectTitle');
        if (titleElement && project.title) {
            titleElement.textContent = `- ${project.title}`;
        }
        // ------------------------------------------

        const members = project.members || [];
        const ownerId = project.owner._id || project.owner; 
        
        const badgeElement = document.querySelector('.badge.bg-secondary');
        if (badgeElement) badgeElement.textContent = `${members.length} membres`;

        const listDiv = document.getElementById('membersList');
        
        if (members.length === 0) {
            listDiv.innerHTML = `<p class="text-muted">Aucun membre dans ce projet pour le moment.</p>`;
            return;
        }

        // 👉 LE BOUTON ASSIGNER A ÉTÉ AJOUTÉ ICI :
        listDiv.innerHTML = members.map(member => `
            <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                <div class="text-start">
                    <strong><i class="bi bi-person-circle me-2"></i>${member.nom || member.name || 'Utilisateur'}</strong>
                    <br><small class="text-muted ms-4">${member.email}</small>
                </div>
                <div>
                    <a href="tasks.html?id=${PROJECT_ID}&assignTo=${member._id}" class="btn btn-sm btn-success me-2">
                        <i class="bi bi-plus-circle"></i> Assigner une tâche
                    </a>
                    <button class="btn btn-outline-danger btn-sm" onclick="removeMember('${member._id}')">
                        <i class="bi bi-person-x"></i> Retirer
                    </button>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error("Erreur complète :", err);
        document.getElementById('membersList').innerHTML = `<p class="text-danger">Erreur lors du chargement des membres.</p>`;
    }
}

// 2. Gérer le formulaire d'invitation
document.getElementById('addMemberForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!PROJECT_ID) return alert("Aucun projet sélectionné !");

    const emailInput = e.target.querySelector('input[type="email"]');
    const email = emailInput.value.trim();

    try {
        await axios.post(`${BASE_URL}/${PROJECT_ID}/invite`, { email }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        alert("Membre invité avec succès !");
        emailInput.value = ''; 
        loadMembers(); 
        
    } catch (err) {
        alert(err.response?.data?.msg || err.response?.data?.error || "Erreur lors de l'invitation du membre");
    }
});

// if u wanna delete a member
window.removeMember = async function(memberId) {
    if (!confirm("Êtes-vous sûr de vouloir retirer ce membre du projet ?")) return;

    try {
        await axios.delete(`${BASE_URL}/${PROJECT_ID}/members/${memberId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert("Membre retiré !");
        loadMembers(); 
    } catch (err) {
        alert(err.response?.data?.msg || err.response?.data?.error || "Erreur lors de la suppression");
    }
};

document.addEventListener('DOMContentLoaded', loadMembers);