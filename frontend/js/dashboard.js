// js/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // --- 1. CHARGEMENT DES PROJETS ---
  try {
    // Remplacement de 127.0.0.1 par localhost pour éviter le bug d'affichage/CORS
    const resProjects = await axios.get('http://localhost:5000/api/projects', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Selon la structure de ton backend, les données sont soit dans resProjects.data, soit dans resProjects.data.data
    const projects = resProjects.data.data || resProjects.data || [];
    document.getElementById('projetsActifs').textContent = projects.length;

  } catch (err) {
    console.error('Erreur projets:', err);
    document.getElementById('projetsActifs').textContent = '0';
  }

  // --- 2. CHARGEMENT DE TOUTES LES TÂCHES (HORS PAGINATION) ---
  try {
    // ATTENTION : On n'envoie PAS de ?page=1&limit=6 pour récupérer l'INTEGRALITÉ des tâches
    const resTasks = await axios.get('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // On extrait le tableau brut des tâches
    let allTasks = [];
    if (resTasks.data && Array.isArray(resTasks.data.data)) {
      allTasks = resTasks.data.data; // Si ton backend renvoie la structure paginée par défaut même sans paramètres
    } else if (Array.isArray(resTasks.data)) {
      allTasks = resTasks.data; // Si ton backend renvoie tout le tableau d'un coup
    }

    // Si ton backend limite TOUJOURS la réponse à 6 même sans paramètres, 
    // l'idéal est de vérifier si ton API renvoie une propriété "total" ou "totalItems" dans resTasks.data
    const totalAssignees = resTasks.data.totalTasks || resTasks.data.total || allTasks.length;

    // Calcul précis sur l'ensemble des tâches récupérées
    const totalTerminees = allTasks.filter(task => task.status === 'terminé').length;
    
    const maintenant = new Date();
    const totalRetard = allTasks.filter(task => {
      return task.status !== 'terminé' && task.deadline && new Date(task.deadline) < maintenant;
    }).length;

    // Injection dans le HTML
    document.getElementById('tachesAssignees').textContent = totalAssignees;
    document.getElementById('tachesTerminees').textContent = totalTerminees;
    document.getElementById('tachesRetard').textContent = totalRetard;

  } catch (err) {
    console.error('Erreur tâches:', err);
    document.getElementById('tachesAssignees').textContent = '0';
    document.getElementById('tachesTerminees').textContent = '0';
    document.getElementById('tachesRetard').textContent = '0';
  }
});