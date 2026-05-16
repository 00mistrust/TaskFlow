document.addEventListener('DOMContentLoaded', () => {
  const storedName = localStorage.getItem('userName');
  const userNameSpan = document.getElementById('userName');

  console.log("JIBNA NAME MN LOCALSTORAGE", storedName);
  console.log("HTML Span element found:", userNameSpan);

  if (storedName && userNameSpan) {
    userNameSpan.textContent = storedName;
    console.log("navbar tbdlat ", storedName);
  } else {
    console.log("failed to change name f navbar");
  }
});
// Gérer le clic sur le bouton de déconnexion avec confirmation
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault(); 
    const reponse = confirm("Êtes-vous sûr de vouloir vous déconnecter ?");
    
    if (reponse) {
      localStorage.removeItem('token');
      localStorage.removeItem('userName'); 
      window.location.href = 'login.html'; 
    }
  });
}