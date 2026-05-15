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

document.getElementById('password').addEventListener('input', (e) => {
  const password = e.target.value;
  const strengthText = document.getElementById('passwordStrength');
  

  if (password.length === 0) {
    strengthText.textContent = '';
    return;
  }

  if (password.length <= 4) {
    strengthText.textContent = 'Faible ';
    strengthText.style.color = '#dc3545'; 
  } 
  else if (password.length > 4 && password.length <= 8) {
    strengthText.textContent = 'Moyen ';
    strengthText.style.color = '#ffc107'; 
  } 
  else {
    strengthText.textContent = 'Fort ';
    strengthText.style.color = '#198754'; 
  }
});