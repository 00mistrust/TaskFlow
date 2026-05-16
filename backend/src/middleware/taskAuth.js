// middleware/taskAuth.js
const mongoose = require('mongoose');
const Project = require('../models/Project');

module.exports = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id; 

    const TaskModel = mongoose.model('task'); 
    const task = await TaskModel.findById(taskId);
    if (!task) return res.status(404).json({ error: "Tâche non trouvée" });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ error: "Projet parent introuvable" });

    const isOwner = project.owner.toString() === userId;
    const isProjectMember = project.members.map(id => id.toString()).includes(userId);

    // 1. General Membership Gate
    if (!isOwner && !isProjectMember) {
      return res.status(403).json({ error: "Accès refusé. Vous ne faites pas partie de ce projet." });
    }

    // 2. Structural Gate (PUT/DELETE)
    if ((req.method === 'PUT' || req.method === 'DELETE') && !isOwner) {
      return res.status(403).json({ error: "Modification interdite. Seul le créateur peut modifier la structure de cette tâche." });
    }

    // 3. REASSIGNMENT GATE (PATCH /:id/assign)
    if (req.route.path === '/:id/assign' && !isOwner) {
      return res.status(403).json({ error: "Modification interdite. Seul le propriétaire du projet peut réassigner des tâches." });
    }

    // 4. Status Gate (PATCH /:id/status)
    if (req.route.path === '/:id/status') {
      const isAssignedToThisTask = task.assignedTo && task.assignedTo.toString() === userId;
      if (!isOwner && !isAssignedToThisTask) {
        return res.status(403).json({ error: "Vous pouvez uniquement modifier le statut des tâches qui vous sont assignées." });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};