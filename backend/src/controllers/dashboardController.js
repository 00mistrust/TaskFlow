const Task = require('../models/task');
const Project = require('../models/project');

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const projetsActifs = await Project.countDocuments({
      owner: userId,
      statut: 'actif'
    });

    const tachesAssignees = await Task.countDocuments({
      assignedTo: userId
    });

    const tachesTerminees = await Task.countDocuments({
      assignedTo: userId,
      statut: 'terminé'
    });

    const tachesRetard = await Task.countDocuments({
      assignedTo: userId,
      statut: { $ne: 'terminé' },
      dateLimite: { $lt: new Date() }
    });

    res.json({
      projetsActifs,
      tachesAssignees,
      tachesTerminees,
      tachesRetard
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};