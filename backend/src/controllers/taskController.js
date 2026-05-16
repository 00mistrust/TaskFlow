const Task = require('../models/Task');
const { logActivity } = require('./activityController'); 

exports.getTasksByProject = async (req, res) => {
  try {
    // Le paramètre peut venir de l'URL (/project/:id) ou être global
    const projectId = req.params.projectId || req.params.id; 
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    // Construction du filtre Mongoose conditionnel
    let filter = {};
    if (projectId) filter.project = projectId;
    
    // Filtres exacts
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

    // (Regex)
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Récupération des données
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email') 
      .sort({ priority: -1, dueDate: 1 })
      .skip(skip)
      .limit(limit);

    // Comptage total pour la pagination
    const total = await Task.countDocuments(filter);

    // Reponse au format exact attendu par frontend
    res.json({
      data: tasks,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// créer une tâche
exports.createTask = async (req, res) => {
  try {
    // Le frontend envoie le "project" directement dans req.body
    const task = new Task(req.body);
    await task.save();

    await logActivity('task_created', task.project, req.user.id, `A créé la tâche "${task.title}"`);

    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT modifier une tâche entière
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
    res.status(400).json({ error: err.message });
  }
};

// mettre à jour uniquement le statut 
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('assignedTo', 'name email');
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });
    
    //  les membres puissent changer le statut
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// supprimer une tache
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });

    // Décommente ça quand ton système d'activité marchera
    await logActivity('task_deleted', task.project, req.user.id, `A supprimé la tâche "${task.title}"`);


    res.json({ message: 'Tâche supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH assigner une tache a un membre 
exports.assignTask = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    
    // verify if assigned to user exists

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { assignedTo },
      { new: true }
    ).populate('assignedTo', 'name email');
    
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};