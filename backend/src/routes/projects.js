const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

const authMiddleware = require('../middleware/auth'); 

// Créer un projet 
router.post('/', authMiddleware, projectController.createProject);
//display all projects 
router.get('/', authMiddleware, projectController.getAllProjects);
// recuper projet specifique
router.get('/:id', authMiddleware, projectController.getProjectById);

// invite memberby email
router.post('/:id/invite', authMiddleware, projectController.inviteMember);

// 7ayd membre
router.delete('/:id/members/:memberId', authMiddleware, projectController.removeMember);
// Supprimer un projet
router.delete('/:id', authMiddleware, projectController.deleteProject);

module.exports = router;