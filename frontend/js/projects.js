const form = document.getElementById('projectForm');
const container = document.getElementById('container');

// فاش نكليكي على "Créer"
form.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const projectData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        deadline: document.getElementById('deadline').value
    };

    const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
    });

    if (response.ok) {
        alert('Projet ajouté بنجاح!');
        loadProjects();
    } else {
        alert('وقع خطأ، عاودي جربي');
    }
});

// دالة باش تجبدي المشاريع
async function loadProjects() {
    const res = await fetch('/api/projects');
    const projects = await res.json();
    container.innerHTML = projects.map(p => `
        <div class="card p-2 mb-2">
            <strong>${p.title}</strong>
            <p>${p.description}</p>
        </div>
    `).join('');
}

loadProjects();