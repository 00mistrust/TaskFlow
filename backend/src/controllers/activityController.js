const Activity = require('../models/Activity');

// Fonction pour créer une activité
const logActivity = async (actionType, projectId, userId, description) => {
  try {
    const activity = new Activity({
      actionType,
      project: projectId,
      user: userId,
      description
    });
    await activity.save();
  } catch (err) {
    console.error('Erreur log activité:', err.message);
  }
};

// GET activités d'un projet
exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ project: req.params.id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST créer une activité manuellement
exports.createActivity = async (req, res) => {
  try {
    const { actionType, project, description } = req.body;
    await logActivity(actionType, project, req.user.id, description);
    res.status(201).json({ message: 'Activité enregistrée' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.logActivity = logActivity;