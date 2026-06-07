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
// Importation des fichiers de routes (CORRIGÉ AVEC LES 'S')
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

// Route de test d'accueil
app.get('/', (req, res) => res.json({ message: 'Nice Job Team, proud of you ALL, now time to show up !' }));
// Middleware de gestion d'erreurs global (à mettre juste avant app.listen)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});
// Lancement du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});