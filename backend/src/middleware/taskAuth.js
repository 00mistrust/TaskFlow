// middleware/taskAuth.js
const mongoose = require('mongoose');
const Project = require('../models/Project');

module.exports = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id; // Form your authMiddleware payload

    const TaskModel = mongoose.model('task'); // Clean case-sensitive model extraction
    const task = await TaskModel.findById(taskId);
    if (!task) return res.status(404).json({ error: "Tâche non trouvée" });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ error: "Projet parent introuvable" });

    // Track roles dynamically across the request pipeline
    const isOwner = project.owner.toString() === userId;
    const isProjectMember = project.members.map(id => id.toString()).includes(userId);

    if (!isOwner && !isProjectMember) {
      return res.status(403).json({ error: "Accès refusé. Vous ne faites pas partie de ce projet." });
    }

    // Intercept full changes (PUT/DELETE) if they are just project members
    if ((req.method === 'PUT' || req.method === 'DELETE') && !isOwner) {
      return res.status(403).json({ error: "Modification interdite. Seul le créateur peut modifier la structure de cette tâche." });
    }

    // Intercept partial status modifications to ensure members only update tasks explicitly assigned to them
    if (req.route.path === '/:id/status') {
      const isAssignedToThisTask = task.assignedTo && task.assignedTo.toString() === userId;
      if (!isOwner && !isAssignedToThisTask) {
        return res.status(403).json({ error: "Vous pouvez uniquement modifier le statut des tâches qui vous sont assignées." });
      }
    }

    // Pass items downstream safely to your controllers
    req.projectContext = project;
    req.taskContext = task;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
