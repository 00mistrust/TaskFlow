document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nom = document.getElementById('nom').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    await axios.post('http://localhost:5000/api/auth/register', {
      nom: nom,
      email: email,
      motDePasse: password
    });

    alert('Compte créé avec succès !');
    window.location.href = 'login.html';
  } catch (err) {
    alert('Erreur lors de la création du compte !');
  }
});