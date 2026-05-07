const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date },
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

// الـ Middleware ديال الحذف المتسلسل (Cascade Delete)
projectSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  const Task = mongoose.model('Task');
  await Task.deleteMany({ project: this._id });
  next();
});

module.exports = mongoose.model('Project', projectSchema);