document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: email,
      motDePasse: password
    });

    localStorage.setItem('token', response.data.token);
    localStorage.setItem('userName', response.data.nom);
    window.location.href = 'dashboard.html';
  } catch (err) {
    alert('Email ou mot de passe incorrect !');
  }
});