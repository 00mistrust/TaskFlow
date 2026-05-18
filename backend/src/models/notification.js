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

module.exports = mongoose.model('Notification', notificationSchema);