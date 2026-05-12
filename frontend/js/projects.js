const form = document.getElementById('projectForm');
<<<<<<< HEAD
const listeUl = document.getElementById('listeProjets');
=======
const listeUl = document.getElementById('listeProjets'); 
>>>>>>> 19068f3c503162adbf4812a87794df2f0ab10e95

form.addEventListener('submit', async (e) => {
    e.preventDefault();

<<<<<<< HEAD
    const token = localStorage.getItem('token');
=======
    // inputs
>>>>>>> 19068f3c503162adbf4812a87794df2f0ab10e95
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
<<<<<<< HEAD
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
=======
            
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
>>>>>>> 19068f3c503162adbf4812a87794df2f0ab10e95
