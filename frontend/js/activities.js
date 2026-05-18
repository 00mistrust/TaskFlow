const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

if (!token) window.location.href = 'login.html';

// --- NEW: Extract your User ID from token to determine ownership ---
let MON_ID = null;
try {
  const payload = JSON.parse(atob(token.split('.')[1]));
  MON_ID = payload.id || payload._id || payload.userId;
} catch (e) {
  console.error("Erreur de lecture du token");
}

// --- NEW: Global state to keep track of fetched projects ---
let rawProjectsArray = [];

// Récupère le nom depuis userName 
function getStoredName() {
  return localStorage.getItem('userName') || "Utilisateur";
}

const sessionName = getStoredName();
document.getElementById('userName').textContent = sessionName;

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userName');
  window.location.href = 'login.html';
});

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const projectIdFromUrl = params.get('id');
  if (projectIdFromUrl) {
    loadProjectActivities(projectIdFromUrl);
  } else {
    fetchProjectPacks();
  }

  // --- NEW: Attach filter change listener ---
  const projectFilter = document.getElementById('projectFilter');
  if (projectFilter) {
    projectFilter.addEventListener('change', (e) => {
      renderFilteredPacks(e.target.value);
    });
  }
});

async function fetchProjectPacks() {
  try {
    showLoading("Chargement de vos packs projets...");
    const res = await axios.get(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Handle payload structural variations safely
    rawProjectsArray = res.data.data || res.data || [];

    // Reset layout filter dropdown back to "all" on fresh initialization
    const projectFilter = document.getElementById('projectFilter');
    if (projectFilter) projectFilter.value = 'all';

    renderFilteredPacks('all');

  } catch (error) {
    showErrorState("Impossible de charger les projets. Vérifiez que votre backend tourne.");
  }
}

// --- NEW: Separate function for handling active filtering & card printing ---
function renderFilteredPacks(filterType) {
  const grid = document.getElementById('projectsGrid');
  grid.innerHTML = '';

  if (!rawProjectsArray || rawProjectsArray.length === 0) {
    showEmptyState("Vous n'avez aucun projet pour le moment.");
    return;
  }

  // Apply filtering rules using the logic from projects.js
  const filteredProjects = rawProjectsArray.filter(project => {
    const ownerId = project.owner ? (project.owner._id || project.owner) : null;
    const isMine = String(ownerId) === String(MON_ID);

    if (filterType === 'mine') return isMine;
    if (filterType === 'shared') return !isMine;
    return true; // 'all'
  });

  if (filteredProjects.length === 0) {
    hideStatus();
    grid.innerHTML = `<div class="text-muted small text-center my-4 w-100">Aucun projet ne correspond à ce filtre.</div>`;
    return;
  }

  hideStatus();

  // Print cards
  filteredProjects.forEach(project => {
    const card = document.createElement('div');
    card.className = 'project-pack-card';
    card.onclick = () => loadProjectActivities(project._id, project.title);
    card.innerHTML = `
      <div class="project-meta-left">
        <div class="folder-icon"><i class="bi bi-folder-fill"></i></div>
        <div>
          <h4 class="project-name-title">${project.title}</h4>
          <small class="text-muted d-block">${project.description || 'Pas de description'}</small>
        </div>
      </div>
      <span class="btn btn-sm btn-outline-primary">ouvrir</span>
    `;
    grid.appendChild(card);
  });
}

async function loadProjectActivities(projectId, projectTitle = '') {
  history.pushState(null, '', `activities.html?id=${projectId}`);
  document.getElementById('packsSection').style.display = 'none';
  document.getElementById('feedSection').style.display = 'block';
  document.getElementById('btnBack').style.display = 'inline-block';

  if (projectTitle) {
    document.getElementById('pageTitle').innerHTML = `Historique — <strong>${projectTitle}</strong>`;
  } else {
    document.getElementById('pageTitle').innerHTML = `<strong>Historique du projet</strong>`;
  }

  const timeline = document.getElementById('timelineContainer');
  timeline.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-primary" role="status"></div></div>';

  let res;
  try {
    res = await axios.get(`${API_URL}/projects/${projectId}/activities`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (err) {
    timeline.innerHTML = `
      <div class="alert alert-warning text-center">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        Erreur : La route d'activité n'existe pas dans le backend.
      </div>`;
    return;
  }

  try {
    const activities = res.data.data || res.data || [];
    timeline.innerHTML = '';

    if (activities.length === 0) {
      timeline.innerHTML = `
        <div class="text-center py-5 text-muted">
          <i class="bi bi-hourglass-split fs-2 d-block mb-2"></i>
          Aucune action enregistrée pour ce projet pour le moment.
        </div>`;
      return;
    }

    activities.forEach(activity => {
      const item = document.createElement('div');
      item.className = 'activity-item';

      let authorName = sessionName;
      if (activity.user && typeof activity.user === 'object') {
        authorName = activity.user.nom || activity.user.name || sessionName;
      }

      const timeText = formatTimeAgo(activity.createdAt || new Date());
      let actionText = activity.description || activity.action || "a interagi avec le projet";

      item.innerHTML = `
        <div class="activity-text">
          <strong>${authorName}</strong> ${actionText}
        </div>
        <div class="activity-time">— ${timeText}</div>
      `;
      timeline.appendChild(item);
    });

  } catch (parseError) {
    console.error("Erreur de rendu :", parseError);
  }
}

function formatTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60 || isNaN(diffInSeconds)) return "il y a quelques secondes";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
}

function showPacksView() {
  history.pushState(null, '', 'activities.html');
  document.getElementById('packsSection').style.display = 'block';
  document.getElementById('feedSection').style.display = 'none';
  document.getElementById('btnBack').style.display = 'none';
  document.getElementById('pageTitle').innerHTML = "<strong>Historique des activités</strong>";
  fetchProjectPacks();
}

function showLoading(msg) {
  const sm = document.getElementById('statusMessage');
  sm.style.display = 'block';
  sm.innerHTML = `<div class="spinner-border text-primary mb-2" role="status"></div><p>${msg}</p>`;
  document.getElementById('projectsGrid').innerHTML = '';
}

function showEmptyState(msg) {
  const sm = document.getElementById('statusMessage');
  sm.style.display = 'block';
  sm.innerHTML = `<i class="bi bi-folder-x fs-1 d-block mb-3" style="color: #6b7280;"></i><p>${msg}</p>`;
}

function showErrorState(msg) {
  const sm = document.getElementById('statusMessage');
  sm.style.display = 'block';
  sm.innerHTML = `<i class="bi bi-exclamation-octagon fs-1 text-danger d-block mb-3"></i><p class="text-danger">${msg}</p>`;
}

function hideStatus() {
  const sm = document.getElementById('statusMessage');
  if (sm) sm.style.display = 'none';
}