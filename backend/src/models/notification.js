const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  lu: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['tache_assignee', 'statut_modifie', 'ajout_projet'],
    required: true
  }
}, { timestamps: true });

<<<<<<< HEAD
module.exports = mongoose.model('Notification', notificationSchema);
=======
module.exports = mongoose.model("Notification", NotificationSchema);
>>>>>>> 152c3d67eac1e29d5490d337a184890fd1304d3f
