const notifToken = localStorage.getItem('token');

async function fetchNotifications() {
  try {
    const response = await axios.get('https://taskflow-backend.onrender.com/api/notifications', {
      headers: { Authorization: `Bearer ${notifToken}` }
    });

    const notifications = response.data;
    const nonLues = notifications.filter(n => !n.lu);

    // Update badge
    const badge = document.getElementById('notifBadge');
    badge.textContent = nonLues.length;
    badge.style.display = nonLues.length > 0 ? 'block' : 'none';

    // Remplir le modal
    const liste = document.getElementById('notifListe');
    liste.innerHTML = '';

    if (notifications.length === 0) {
      liste.innerHTML = '<p class="text-center text-muted">Aucune notification</p>';
      return;
    }

    notifications.forEach(n => {
      const item = document.createElement('div');
      item.className = `p-2 mb-2 rounded ${n.lu ? 'bg-light' : 'bg-white border-start border-primary border-3'}`;
      item.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <span>${n.message}</span>
          ${!n.lu ? `<button class="btn btn-sm btn-outline-primary" onclick="marquerLue('${n._id}')">Lu</button>` : '<span class="badge bg-secondary">Lu</span>'}
        </div>
        <small class="text-muted">${new Date(n.createdAt).toLocaleString()}</small>
      `;
      liste.appendChild(item);

      // Archiver dans localStorage
      const archived = JSON.parse(localStorage.getItem('notifications') || '[]');
      if (!archived.find(a => a._id === n._id)) {
        archived.push(n);
        localStorage.setItem('notifications', JSON.stringify(archived));
      }
    });

  } catch (err) {
    console.error('Erreur notifications:', err);
  }
}

async function marquerLue(id) {
  try {
    await axios.patch(`https://taskflow-backend.onrender.com/api/notifications/${id}/read`, {}, {
      headers: { Authorization: `Bearer ${notifToken}` }
    });
    fetchNotifications();
  } catch (err) {
    console.error('Erreur:', err);
  }
}

// Polling toutes les 30 secondes
fetchNotifications();
setInterval(fetchNotifications, 30000);