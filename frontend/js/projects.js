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
        alert('Project added successfully!');
        loadProjects(); // كنعاودو نليستيو المشاريع باش يبان الجديد
    } else {
        alert('An error occurred, please try again.');
    }
});

// دالة باش تجبدي المشاريع
async function loadProjects() {
    const res = await fetch('/api/projects');
    const projects = await res.json();
    
    // كنعرضوهم فـ الـ div ديال container
    container.innerHTML = projects.map(p => `
        <div class="card p-2 mb-2">
            <strong>${p.title}</strong>
            <p>${p.description}</p>
        </div>
    `).join('');
}

loadProjects(); // كنعيطو لهاد الدالة غير تحل الصفحة
