const Task = require('../models/task'); // Utilise bien le nom du modèle exporté ('task')

exports.getDashboard = async (req, res) => {
  try {
    const aujourdhui = new Date();

    // RÈGLE : Le statut n'est pas "terminé" ET la date de fin est passée
    const nbTachesEnRetard = await Task.countDocuments({
      status: { $ne: 'terminé' },
      dueDate: { $lt: aujourdhui }
    });

    res.json({
      projetsActifs: 0,
      tachesAssignees: 0,
      tachesTerminees: 0,
      tachesRetard: nbTachesEnRetard // Renvoie maintenant le vrai chiffre (+1 pour chaque tâche concernée)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};