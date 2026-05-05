const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// GET toutes les tâches d'un projet AVEC filtrage, recherche et pagination (F6)
router.get('/project/:id', async (req, res) => {
  try {
    const { status, priority, assignedTo, search, page = 1, limit = 10 } = req.query;

    // Filtre de base : le projet
    const filter = { project: req.params.id };

    // Ajout conditionnel des filtres
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) filter.title = { $regex: search, $options: 'i' };

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Exécution de la requête
    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .skip(skip)
      .limit(limitNum);

    res.json({
      data: tasks,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET toutes les tâches (pour test) AVEC filtrage et pagination
router.get('/', async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .skip(skip)
      .limit(limitNum);

    res.json({
      data: tasks,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST créer une tâche
router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT modifier une tâche
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ error: 'Tâche non trouvée' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH mettre à jour uniquement le statut
router.patch('/:id/status', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ error: 'Tâche non trouvée' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE supprimer une tâche
router.delete('/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tâche supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;