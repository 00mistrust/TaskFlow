const form = document.getElementById('projectForm');
const container = document.getElementById('container');

// فاش نكليكي على "Créer"
form.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    // جلب الـ Token اللي مخزن فاش درتي Login
    const token = localStorage.getItem('token'); 

    const projectData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        deadline: document.getElementById('deadline').value
    };

    // زدنا الـ Token في الـ headers باش req.user.id تخدم في Backend
    const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-auth-token': token // تأكدي بلي هادي هي السمية اللي مستعملة في auth middleware
        },
        body: JSON.stringify(projectData)
    });

    if (response.ok) {
        alert('Project added successfully!');
        form.reset(); // باش يتمسح الفورم بعد الزيادة
        loadProjects(); 
    } else {
        // باش تعرفي المشكل بالظبط شنو هو
        const errorData = await response.json();
        alert('Error: ' + (errorData.error || 'Please try again.'));
    }
});

// دالة باش تجبدي المشاريع
async function loadProjects() {
    const token = localStorage.getItem('token');
    
    const res = await fetch('/api/projects', {
        headers: { 'x-auth-token': token }
    });

    if (res.ok) {
        const projects = await res.json();
        container.innerHTML = projects.map(p => `
            <div class="card p-3 mb-3 shadow-sm" style="border-radius: 10px;">
                <h5 class="fw-bold">${p.title}</h5>
                <p class="text-muted">${p.description}</p>
                <small class="text-primary">Deadline: ${new Date(p.deadline).toLocaleDateString()}</small>
            </div>
        `).join('');
    }
}

loadProjects();