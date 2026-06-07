const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());

// Connexion à la Base de Données
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connecté'))
  .catch(err => console.error('Erreur de connexion MongoDB:', err));

// Importation des fichiers de routes
const authRoutes = require('./src/routes/auth');
const projectRoutes = require('./src/routes/projects');
const taskRoutes = require('./src/routes/tasks');
const dashboardRoutes = require('./src/routes/dashboard');
app.use('/api/notifications', require('./src/routes/notifications'));

// Déclaration des endpoints de l'API
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Bloc de log pour voir les routes réellement chargées par Render
console.log("=== ROUTES ENREGISTRÉES ===");
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`Route disponible: ${r.route.path}`);
  } else if (r.name === 'router') {
    r.handle.stack.forEach((s) => {
      if (s.route) {
        console.log(`Route d'un sous-dossier: ${s.route.path}`);
      }
    });
  }
});
console.log("===========================");

// Route de test d'accueil
app.get('/', (req, res) => res.json({ message: 'Nice Job Team, proud of you ALL, now time to show up !' }));

// Lancement du serveur
app.listen(process.env.PORT || 5000, () => {
  console.log(`Serveur lancé sur le port ${process.env.PORT || 5000}`);
});