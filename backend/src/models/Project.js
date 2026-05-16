const mongoose = require('mongoose');
const Task = require('./task'); 

const projectSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  deadline: { 
    type: Date 
  },
  status: { 
    type: String, 
    enum: ['actif', 'en pause', 'archivé'], 
    default: 'actif' 
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  members: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }]
}, { timestamps: true });

// Middleware Mongoose pour la suppression en cascade des tâches
projectSchema.pre('deleteOne', { document: false, query: true }, async function(next) {
  const project = await this.model.findOne(this.getFilter());
  if (project) {
    await mongoose.model('Task').deleteMany({ project: project._id });
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);