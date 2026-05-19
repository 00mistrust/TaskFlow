const BASE_URL = 'http://localhost:5000/api/projects';
const token = localStorage.getItem('token');

// Get project id from url
const params = new URLSearchParams(window.location.search);
const PROJECT_ID = params.get('id');

if (!token) {
    window.location.href = 'login.html';
}

// Helper function to decode the JWT token and get the logged-in user's ID
function getCurrentUserId() {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decoded = JSON.parse(jsonPayload);
        // Returns the user ID (adjusts to 'id' or '_id' depending on your backend JWT payload structure)
        return decoded.id || decoded._id; 
    } catch (error) {
        console.error("Erreur lors du décodage du token :", error);
        return null;
    }
}

async function loadMembers() {
    if (!PROJECT_ID) {
        document.getElementById('membersList').innerHTML = `
            <div class="alert alert-warning text-center">
                <p class="mb-3"><i class="bi bi-exclamation-triangle-fill me-2"></i> Il faut aller vers projets, créer un projet et cliquer sur le bouton membre pour assigner un membre au projet spécifique.</p>
                <a href="projects.html" class="btn btn-sm text-white px-3" style="background-color: #8f8d73; border-radius: 6px;">
                    <i class="bi bi-folder me-1"></i> Aller aux projets
                </a>
            </div>`;
        return;
    }
    
    try {
        const res = await axios.get(`${BASE_URL}/${PROJECT_ID}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const project = res.data.data || res.data;

        // Injection du nom du projet sous "Membres actuels"
        const titleElement = document.getElementById('projectTitle');
        if (titleElement && project.title) {
            titleElement.innerHTML = `<i class="bi bi-folder me-1"></i> Projet : <span class="text-warning fw-bold">${project.title}</span>`;
        }

        const members = project.members || [];
        const ownerId = project.owner._id || project.owner; 
        const currentUserId = getCurrentUserId();

        // Check ownership
        const isOwner = currentUserId === ownerId;

        // Hide or Show the "Invite a member" card block based on ownership
        const inviteCard = document.getElementById('inviteCard');
        if (inviteCard) {
            inviteCard.style.display = isOwner ? 'block' : 'none';
        }
        
        const badgeElement = document.querySelector('.badge.bg-secondary');
        if (badgeElement) badgeElement.textContent = `${members.length} membres`;

        const listDiv = document.getElementById('membersList');
        
        if (members.length === 0) {
            listDiv.innerHTML = `<p class="text-muted">Aucun membre dans ce projet pour le moment.</p>`;
            return;
        }

        // Render members list with conditional buttons
        listDiv.innerHTML = members.map(member => {
            // Check if this loop item is the actual owner (optional styling tip: maybe highlight them!)
            const isMemberOwner = member._id === ownerId;

            return `
            <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                <div class="text-start">
                    <strong>
                        <i class="bi bi-person-circle me-2"></i>${member.nom || member.name || 'Utilisateur'}
                        ${isMemberOwner ? '<span class="badge bg-primary ms-2" style="font-size:0.7rem;">Propriétaire</span>' : ''}
                    </strong>
                    <br><small class="text-muted ms-4">${member.email}</small>
                </div>
                <div>
                    ${isOwner ? `
                        <a href="tasks.html?id=${PROJECT_ID}&assignTo=${member._id}" class="btn btn-sm btn-success me-2">
                            <i class="bi bi-plus-circle"></i> Assigner une tâche
                        </a>
                        ${!isMemberOwner ? `
                            <button class="btn btn-outline-danger btn-sm" onclick="removeMember('${member._id}')">
                                <i class="bi bi-person-x"></i> Retirer
                            </button>
                        ` : ''}
                    ` : ''}
                </div>
            </div>
        `}).join('');

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

// Remove a member
window.removeMember = async function(memberId) {
    if (!confirm("Êtes-vous sûr de vouloir retirer ce membre du projet ?")) return;

    const requestUrl = `${BASE_URL}/${PROJECT_ID}/members/${memberId}`;
    
    try {
        await axios.delete(requestUrl, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert("Membre retiré !");
        loadMembers(); 
    } catch (err) {
        console.error("Erreur de la requête Axios :", err);
        alert(err.response?.data?.msg || err.response?.data?.error || "Erreur lors de la suppression");
    }
};

document.addEventListener('DOMContentLoaded', loadMembers);