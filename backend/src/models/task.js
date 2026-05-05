const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['basse', 'moyenne', 'haute'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['à faire', 'en cours', 'terminé'], 
    required: true 
  },
  project: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);