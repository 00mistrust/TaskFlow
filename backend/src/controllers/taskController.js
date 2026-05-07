const Task = require('../models/Task');


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


exports.createTask = async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      project: req.params.id
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


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


exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });
    res.json({ message: 'Tâche supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


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









