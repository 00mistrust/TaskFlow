const form = document.getElementById('projectForm');
const listeUl = document.getElementById('listeProjets'); // الـ UL اللي غنزيدو فيها

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. كنجيبو القيم من الـ inputs
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const deadline = document.getElementById('deadline').value;

    if (title.trim() === "") return;

    // 2. كنصيفطو الداتا للباكيند (باش تبقى مسيفية)
    try {
        const response = await fetch('http://127.0.0.1:5000/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, deadline })
        });

        if (response.ok) {
            // --- هاد الجزء هو اللي كيخلي المشروع يبان بحال التصويرة ---
            
            // TODO 2: Créer un élément <li>
            const li = document.createElement('li');
            li.className = "list-group-item d-flex justify-content-between align-items-center mb-2 shadow-sm";

            // TODO 3: Mettre le texte (العنوان لي كتبتيه)
            // درنا span باش نتحكمو ف الستيل بحال التصويرة
            const span = document.createElement('span');
            span.innerHTML = `<strong class="text-primary">${title}</strong>`; 
            li.appendChild(span);

            // TODO 4: Créer le bouton 'Supprimer'
            const btnSupprimer = document.createElement('button');
            btnSupprimer.textContent = "Supprimer";
            btnSupprimer.className = "btn btn-light border btn-sm"; // ستيل كيشبه للتصويرة
            
            btnSupprimer.onclick = function() {
                li.remove(); // كيمسح السطر
            };

            // TODO 5: Ajouter le bouton dans le <li> عاد الـ <li> في الـ <ul>
            li.appendChild(btnSupprimer);
            listeUl.appendChild(li);

            // TODO 6: Vider le champ
            form.reset();
        }
    } catch (error) {
        // إيلا السيرفر فيه مشكل، غنزيدوه غير فـ الواجهة (Front) باش تشوفي النتيجة
        console.log("الباكيند مجاوبش، ولكن غنزيدوه ف الـ DOM باش تشوفيه");
        creerElementManuellement(title); 
    }
});

// دالة مساعدة إيلا بغيتي غير التيست بلا سيرفر
function creerElementManuellement(valeur) {
    const li = document.createElement('li');
    li.className = "list-group-item d-flex justify-content-between align-items-center mb-2";
    li.innerHTML = `<span style="color: black;">• ${valeur}</span>`;
    
    const btn = document.createElement('button');
    btn.textContent = "Supprimer";
    btn.onclick = () => li.remove();
    
    li.appendChild(btn);
    listeUl.appendChild(li);
}