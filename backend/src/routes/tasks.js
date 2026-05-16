// routes/tasks.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth'); 
const taskAuthShield = require('../middleware/taskAuth'); // <-- Import the role validator

router.use(authMiddleware);

router.get('/', taskController.getTasksByProject); 
router.get('/project/:projectId', authMiddleware, taskController.getTasksByProject); 

router.post('/', taskController.createTask); // Handled inside controller body for owner check

// Protect these routes using the new permission shield middleware:
router.put('/:id', taskAuthShield, taskController.updateTask);
router.patch('/:id/status', taskAuthShield, taskController.updateTaskStatus);
router.delete('/:id', taskAuthShield, taskController.deleteTask);

// Extra helper endpoints
router.patch('/:id/assign', taskAuthShield, taskController.assignTask);

module.exports = router;