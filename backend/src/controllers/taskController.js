const Task = require('../models/Task');
const { logActivity } = require('./activityController');

// GET toutes les tâches d'un projet
exports.getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.id })
      .populate('assignedTo', 'name email')
      .sort({ priority: -1, dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET tâches assignées à l'utilisateur connecté
exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      project: req.params.id,
      assignedTo: req.user.id
    })
      .populate('assignedTo', 'name email')
      .sort({ priority: -1, dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST créer une tâche
exports.createTask = async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      project: req.params.id
    });
    await task.save();

    // Log activité ⭐
    await logActivity(
      'task_created',
      req.params.id,
      req.user.id,
      `A créé la tâche "${task.title}"`
    );

    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT modifier une tâche
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('assignedTo', 'name email');
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PATCH mettre à jour le statut
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('assignedTo', 'name email');
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE supprimer une tâche
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });

    // Log activité ⭐
    await logActivity(
      'task_deleted',
      task.project,
      req.user.id,
      `A supprimé la tâche "${task.title}"`
    );

    res.json({ message: 'Tâche supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH assigner une tâche à un membre
exports.assignTask = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { assignedTo },
      { new: true }
    ).populate('assignedTo', 'name email');
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
