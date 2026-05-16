const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth'); 

router.use(authMiddleware);

// Routes demandes par frontend
router.get('/', taskController.getTasksByProject); 
//idk which one ill test ,later
//router.get('/project/:projectId', taskController.getTasksByProject);
router.get('/project/:projectId', authMiddleware, taskController.getTasksByProject); 
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.patch('/:id/status', taskController.updateTaskStatus);
router.patch('/:id/assign', taskController.assignTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;