const express = require('express');
const router = express.Router();
const Task = require('../models/task');

// GET toutes les tâches d'un projet
router.get('/api/projects/:id/tasks', async (req, res) => {
  const tasks = await Task.find({ projectId: req.params.id });
  res.json(tasks);
});

// POST créer une tâche
router.post('/api/tasks', async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  res.json(task);
});

// PUT modifier une tâche
router.put('/api/tasks/:id', async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(task);
});

// DELETE supprimer une tâche
router.delete('/api/tasks/:id', async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: 'Tâche supprimée' });
});

module.exports = router;
// PATCH mettre à jour uniquement le statut
router.patch('/api/tasks/:id/status', async (req, res) => {
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  res.json(task);
});
