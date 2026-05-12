const form = document.getElementById('projectForm');
const listeUl = document.getElementById('listeProjets');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
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
            const li = document.createElement('li');
            li.className = "list-group-item d-flex justify-content-between align-items-center mb-2 shadow-sm";

            const span = document.createElement('span');
            span.innerHTML = `<strong class="text-primary">${title}</strong>`; 
            li.appendChild(span);

            const btnSupprimer = document.createElement('button');
            btnSupprimer.textContent = "Supprimer";
            btnSupprimer.className = "btn btn-light border btn-sm";
            
            btnSupprimer.onclick = function() {
                li.remove();
            };

            li.appendChild(btnSupprimer);
            listeUl.appendChild(li);
            form.reset();
        }
    } catch (error) {
        console.log("Erreur serveur !");
    }
});