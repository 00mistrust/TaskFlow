// js/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // --- 0. RÉCUPÉRATION DE TON ID UTILISATEUR ---
 // --- 0. RÉCUPÉRATION DE TON ID ET TON NOM ---
  let currentUserId = null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    currentUserId = String(payload.id || payload._id || payload.userId || '').trim();
    
    // 💡 NOUVEAUTÉ : On essaie de récupérer ton nom depuis le token ou le localStorage
    let userName = payload.name || payload.username || payload.prenom || 'Utilisateur';
    
    // Si ton script de login l'a sauvegardé dans le localStorage, on le prend en priorité
    const storedName = localStorage.getItem('userName') || localStorage.getItem('name');
    if (storedName) {
      userName = storedName;
    }

    // On l'injecte dans le HTML
    const welcomeElement = document.getElementById('dashboardWelcomeName');
    if (welcomeElement) {
      welcomeElement.textContent = userName;
    }

  } catch (e) {
    console.error("❌ Erreur de lecture du token :", e);
  }let projects = [];

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

  // --- 2. CHARGEMENT DES TÂCHES PROJET PAR PROJET ---
  try {
    let allTasks = [];

    const taskPromises = projects.map(async (p) => {
      const pId = p._id || p.id;
      try {
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

    await Promise.all(taskPromises);

    // --- 3. 🔥 NOUVEAU FILTRAGE STRICT CORRIGÉ ---
    const tachesMeConcernant = allTasks.filter(task => {
      // Vérification du propriétaire du projet
      let taskProjectId = task.project ? (typeof task.project === 'object' ? (task.project._id || task.project.id) : task.project) : '';
      const jeSuisProprioDuProjet = mesProjetsIds.includes(String(taskProjectId));

      // Vérification de l'assignation
      let assigneeId = task.assignedTo ? (typeof task.assignedTo === 'object' ? (task.assignedTo._id || task.assignedTo.id) : task.assignedTo) : '';
      const nettonieAssigneeId = String(assigneeId).trim();
      
      const mEstAssignee = nettonieAssigneeId === currentUserId;
      const estNonAssignee = !assigneeId || nettonieAssigneeId === '' || nettonieAssigneeId === 'null' || nettonieAssigneeId === 'undefined';

      // RÈGLE STRICTE : La tâche me concerne UNIQUEMENT si :
      // - Elle m'est personnellement assignée
      // - OU elle n'est assignée à PERSONNE mais le projet est à moi
      return mEstAssignee || (estNonAssignee && jeSuisProprioDuProjet);
    });

    // --- 4. CALCULS ET COMPTEURS ---
    const totalAssignees = tachesMeConcernant.length;

    const totalTerminees = tachesMeConcernant.filter(task => {
      const statusClean = (task.status || '').toLowerCase().trim();
      return statusClean === 'terminé' || statusClean === 'termine';
    }).length;
    
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