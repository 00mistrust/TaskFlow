const mongoose = require('mongoose');
const Task = require('../models/task');
const Project = require('../models/Project');
const { logActivity } = require('./activityController'); 

// Secure Model Reference using your precise case name configuration
const TaskModel = mongoose.model('task');

// GET /project/:projectId (ou /tasks)
exports.getTasksByProject = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.query.project;
    if (!projectId) return res.status(400).json({ error: "ID de projet requis" });

    // 1. Configuration de la pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; 
    const skip = (page - 1) * limit;

    // 2. Construction du filtre (conditionnel)
    const condition = { project: projectId };

    if (req.query.status) condition.status = req.query.status;
    if (req.query.priority) condition.priority = req.query.priority;
    if (req.query.assignedTo) condition.assignedTo = req.query.assignedTo;

    // 3. Recherche par mot-clé avec $regex (option i pour ignorer la casse)
    if (req.query.search) {
      condition.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // 4. Exécution de la requête avec skip, limit et populate
    const tasks = await TaskModel.find(condition)
      .populate('assignedTo', 'nom email')
      .skip(skip)
      .limit(limit);

    // 5. Comptage total pour la pagination
    const total = await TaskModel.countDocuments(condition);

    // 6. Format de retour exigé par le PDF
    res.json({
      data: tasks,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 1. POST / (Create a task)
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, status, dueDate, project: projectId, assignedTo } = req.body;
    const userId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Projet non trouvé" });

    // Only creator creates tasks
    if (project.owner.toString() !== userId) {
      return res.status(403).json({ error: "Seul le créateur du projet peut ajouter des tâches." });
    }

    const task = new TaskModel({
      title,
      description,
      priority,
      status,
      dueDate,
      project: projectId,
      assignedTo: assignedTo || null
    });
    await task.save();

    // AUTOMATIC ASSIGNMENT PIPELINE
    if (assignedTo && assignedTo !== project.owner.toString()) {
      const memberIdStr = assignedTo.toString();
      const currentMembers = project.members.map(m => m.toString());

      if (!currentMembers.includes(memberIdStr)) {
        project.members.push(assignedTo);
        await project.save(); 
      }
    }

    // ENREGISTREMENT DE L'ACTIVITÉ (Saves who did it!)
    await logActivity('task_created', projectId, userId, `A créé la tâche "${title}"`);

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. PUT /:id (Full Task Update)
exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    const task = await TaskModel.findById(taskId);
    if (!task) return res.status(404).json({ error: "Tâche non trouvée" });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ error: "Projet parent non trouvé" });

    // Restriction: Only the project owner can perform full structural updates/assignments
    if (project.owner.toString() !== userId) {
      return res.status(403).json({ 
        error: "Interdit. En tant que membre assigné, vous devez utiliser la route PATCH pour modifier uniquement le statut." 
      });
    }

    const updatedTask = await TaskModel.findByIdAndUpdate(taskId, req.body, { new: true });

    // Maintain the automatic project assignment on updates if the owner reassigns it to someone new
    if (req.body.assignedTo) {
      if (!project.members.includes(req.body.assignedTo) && project.owner.toString() !== req.body.assignedTo) {
        project.members.push(req.body.assignedTo);
        await project.save();
      }
    }

    // ENREGISTREMENT DE L'ACTIVITÉ
    await logActivity('task_updated', project._id, userId, `A modifié la tâche "${updatedTask.title}"`);

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /:id/status (Status Update Only)
exports.updateTaskStatus = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const { status } = req.body;

    if (!['à faire', 'en cours', 'terminé'].includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }

    const task = await TaskModel.findById(taskId);
    if (!task) return res.status(404).json({ error: "Tâche non trouvée" });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ error: "Projet parent non trouvé" });

    const isOwner = project.owner.toString() === userId;
    const isAssigned = task.assignedTo && task.assignedTo.toString() === userId;

    if (!isOwner && !isAssigned) {
      return res.status(403).json({ error: "Accès refusé. Vous n'êtes pas autorisé à modifier cette tâche." });
    }

    task.status = status;
    await task.save();

    // ENREGISTREMENT DE L'ACTIVITÉ
    await logActivity('task_status_changed', project._id, userId, `A changé le statut de la tâche "${task.title}" en "${status}"`);

    res.json({ message: "Statut mis à jour", task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /:id
exports.deleteTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const task = await TaskModel.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });

    // ENREGISTREMENT DE L'ACTIVITÉ
    await logActivity('task_deleted', task.project, userId, `A supprimé la tâche "${task.title}"`);

    res.json({ message: 'Tâche supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /:id/assign
exports.assignTask = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const userId = req.user.id;

    const task = await TaskModel.findByIdAndUpdate(
      req.params.id,
      { assignedTo },
      { new: true }
    ).populate('assignedTo', 'name email nom');
    
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });

    // ENREGISTREMENT DE L'ACTIVITÉ
    const targetName = task.assignedTo ? (task.assignedTo.name || task.assignedTo.nom || "un membre") : "Personne";
    await logActivity('task_assigned', task.project, userId, `A assigné la tâche "${task.title}" à ${targetName}`);

    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};