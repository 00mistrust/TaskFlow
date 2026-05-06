const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'login.html';
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
});

async function loadDashboard() {
  try {
    const response = await axios.get('http://localhost:5000/api/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    document.getElementById('projetsActifs').textContent = response.data.projetsActifs;
    document.getElementById('tachesAssignees').textContent = response.data.tachesAssignees;
    document.getElementById('tachesTerminees').textContent = response.data.tachesTerminees;
    document.getElementById('tachesRetard').textContent = response.data.tachesRetard;
  } catch (err) {
    alert('Session expirée, veuillez vous reconnecter !');
    window.location.href = 'login.html';
  }
}

loadDashboard();