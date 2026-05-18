const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const projectController = require('../controllers/projectController');

//  On importe le vrai nom de la fonction (getActivities)
const { getActivities } = require('../controllers/activityController');


// Créer un projet 
router.post('/', auth, projectController.createProject);

// Afficher tous les projets 
router.get('/', auth, projectController.getAllProjects);

// Récupérer un projet spécifique
router.get('/:id', auth, projectController.getProjectById);

//  On utilise getActivities
router.get('/:id/activities', auth, getActivities);

// Mettre à jour le projet
router.put('/:id', auth, projectController.updateProject);

// Inviter un membre par email
router.post('/:id/invite', auth, projectController.inviteMember);

// Retirer un membre
router.delete('/:id/members/:memberId', auth, projectController.removeMember);

// Supprimer un projet
router.delete('/:id', auth, projectController.deleteProject);

module.exports = router;