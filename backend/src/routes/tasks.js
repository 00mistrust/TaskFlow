const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const auth = require('../middleware/auth');

// GET toutes les tâches d'un projet AVEC filtrage, recherche et pagination
router.get('/project/:id', auth, async (req, res) => {
  try {
    const { status, priority, assignedTo, search, page = 1, limit = 10 } = req.query;
    const filter = { project: req.params.id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .skip(skip)
      .limit(limitNum);
    res.json({ data: tasks, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET tâches assignées à l'utilisateur connecté (dashboard)
router.get('/my-tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate('assignedTo', 'name email')
      .sort({ priority: -1, dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET toutes les tâches
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .skip(skip)
      .limit(limitNum);
    res.json({ data: tasks, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST créer une tâche
router.post('/', auth, async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT modifier une tâche
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');
    if (!task) return res.status(404).json({ error: 'Tâche non trouvée' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH mettre à jour uniquement le statut
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');
    if (!task) return res.status(404).json({ error: 'Tâche non trouvée' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH assigner une tâche à un membre
router.patch('/:id/assign', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { assignedTo: req.body.assignedTo },
      { new: true }
    ).populate('assignedTo', 'name email');
    if (!task) return res.status(404).json({ error: 'Tâche non trouvée' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE supprimer une tâche
router.delete('/:id', auth, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tâche supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;