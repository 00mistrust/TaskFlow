// js/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // --- 0. RÉCUPÉRATION DE TON ID UTILISATEUR ---
  let currentUserId = null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    currentUserId = String(payload.id || payload._id || payload.userId || '').trim();
  } catch (e) {
    console.error("❌ Erreur de lecture du token :", e);
  }

  let mesProjetsIds = [];
  let projects = [];

  // --- 1. CHARGEMENT DES PROJETS ---
  try {
    const resProjects = await axios.get('http://localhost:5000/api/projects', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    projects = resProjects.data.data || resProjects.data || [];
    document.getElementById('projetsActifs').textContent = projects.length;

    projects.forEach(p => {
      let ownerId = p.owner ? (typeof p.owner === 'object' ? (p.owner._id || p.owner.id) : p.owner) : '';
      if (String(ownerId).trim() === currentUserId) {
        mesProjetsIds.push(String(p._id || p.id));
      }
    });

  } catch (err) {
    console.error('❌ Erreur projets:', err);
    document.getElementById('projetsActifs').textContent = '0';
  }

  // --- 2. CHARGEMENT DES TÂCHES PROJET PAR PROJET (CONTOURNEMENT DE L'ERREUR 400) ---
  try {
    let allTasks = [];

    // On crée une liste de requêtes (une par projet) pour s'exécuter en parallèle
    const taskPromises = projects.map(async (p) => {
      const pId = p._id || p.id;
      try {
        // 💡 NOTE : Si ton backend utilise un autre nom de paramètre, change '?project=' par '?projectId='
        const resTasks = await axios.get(`http://localhost:5000/api/tasks?project=${pId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const tasksData = resTasks.data.data || resTasks.data || [];
        if (Array.isArray(tasksData)) {
          allTasks = allTasks.concat(tasksData);
        }
      } catch (taskErr) {
        console.warn(`Impossible de récupérer les tâches pour le projet ${pId}:`, taskErr.message);
      }
    });

    // On attend que toutes les requêtes de tous les projets soient terminées
    await Promise.all(taskPromises);

    // --- 3. FILTRAGE STRICT SELON TES CRITÈRES ---
    const tachesMeConcernant = allTasks.filter(task => {
      // Vérification du projet de la tâche
      let taskProjectId = task.project ? (typeof task.project === 'object' ? (task.project._id || task.project.id) : task.project) : '';
      const jeSuisProprioDuProjet = mesProjetsIds.includes(String(taskProjectId));

      // Vérification de l'assignation de la tâche
      let assigneeId = task.assignedTo ? (typeof task.assignedTo === 'object' ? (task.assignedTo._id || task.assignedTo.id) : task.assignedTo) : '';
      const mEstAssignee = String(assigneeId).trim() === currentUserId;

      // On garde la tâche si elle est dans mes projets OU si elle m'est assignée
      return jeSuisProprioDuProjet || mEstAssignee;
    });

    // --- 4. CALCULS ET COMPTEURS ---
    const totalAssignees = tachesMeConcernant.length;

    // Compte toutes les tâches terminées qui te concernent
    const totalTerminees = tachesMeConcernant.filter(task => {
      const statusClean = (task.status || '').toLowerCase().trim();
      return statusClean === 'terminé' || statusClean === 'termine';
    }).length;
    
    // Compte les tâches en retard
    const maintenant = new Date();
    maintenant.setHours(0,0,0,0);

    const totalRetard = tachesMeConcernant.filter(task => {
      const dateEcheanceRaw = task.dueDate || task.deadline;
      if (!dateEcheanceRaw) return false;

      const dateEcheance = new Date(dateEcheanceRaw);
      dateEcheance.setHours(0,0,0,0);
      
      const statusClean = (task.status || '').toLowerCase().trim();
      return statusClean !== 'terminé' && statusClean !== 'termine' && dateEcheance < maintenant;
    }).length;

    // --- 5. INJECTION DANS LE HTML ---
    document.getElementById('tachesAssignees').textContent = totalAssignees;
    document.getElementById('tachesTerminees').textContent = totalTerminees;
    document.getElementById('tachesRetard').textContent = totalRetard;

  } catch (err) {
    console.error('❌ Erreur globale lors du calcul des tâches:', err);
    document.getElementById('tachesAssignees').textContent = '0';
    document.getElementById('tachesTerminees').textContent = '0';
    document.getElementById('tachesRetard').textContent = '0';
  }
});