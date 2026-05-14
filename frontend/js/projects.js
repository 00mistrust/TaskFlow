const form = document.getElementById('projectForm');
const listeUl = document.getElementById('listeProjets'); 

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // inputs
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const deadline = document.getElementById('deadline').value;

    if (title.trim() === "") return;

    try {
        const response = await fetch('http://127.0.0.1:5000/api/projects', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description, deadline })
        });

        if (response.ok) {
            
            ajouterProjetALaVue(title, description, deadline);
            
            
            form.reset(); 
        }
    } catch (error) {
        console.log("الباكيند مجاوبش، ولكن غنزيدوه يدوياً باش تشوفيه");
        ajouterProjetALaVue(title, description, deadline);
        
        
        form.reset(); 
    }
});


function ajouterProjetALaVue(title, desc, date) {
    const li = document.createElement('li');
    li.className = "list-group-item d-flex justify-content-between align-items-center mb-2 shadow-sm p-3";

    li.innerHTML = `
        <div style="display: flex; flex-grow: 1; align-items: center; gap: 30px;">
            <div style="min-width: 150px;">
                <strong>Nom projet :</strong> <span class="text-primary">${title}</span>
            </div>
            <div style="min-width: 250px; flex-grow: 1;">
                <strong>Description :</strong> <span class="text-muted">${desc || '---'}</span>
            </div>
            <div style="min-width: 180px;">
                <strong>Delay :</strong> <span>${date || 'Non défini'}</span>
            </div>
        </div>
    `;

    const btnSupprimer = document.createElement('button');
    btnSupprimer.textContent = "Supprimer";
    btnSupprimer.className = "btn btn-outline-danger btn-sm ms-3"; 
    
    btnSupprimer.onclick = function() {
        li.remove();
    };

    li.appendChild(btnSupprimer);
    listeUl.appendChild(li);
}
