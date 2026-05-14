const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const authMiddleware = require('../middleware/auth'); 


router.use(authMiddleware);


router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const projects = await Project.find({ owner: req.user.id })  
            .skip(skip)
            .limit(limit);

        const total = await Project.countDocuments({ owner: req.user.id });

        res.json({
            data: projects,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST 
router.post('/', async (req, res) => {
    try {
        const { title, description, deadline } = req.body;
        const newProject = new Project({
            title,
            description,
            deadline,
            owner: req.user.id 
        });

        await newProject.save();
        res.status(201).json(newProject);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT 
router.put('/:id', async (req, res) => {
    try {
        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.id },  
            req.body,
            { new: true }
        );
        if (!project) return res.status(404).json({ error: 'Project non trouvé' });
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id/members/:userId', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
  

        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Only the owner can modify project members' });
        }


        project.members = project.members.filter(m => m.toString() !== req.params.userId);
        await project.save();

        res.json({ message: 'Member removed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//post 
router.post('/:id/members', async (req, res) => {
    try {
        const { userId } = req.body; // الـ ID ديال الشخص اللي باغة تزيديه
        const project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ error: 'Project not found' });


        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Seul le propriétaire peut modifier les membres' });
        }
        
        if (project.members.includes(userId)) {
            return res.status(400).json({ error: 'User is already a member' });
        }

        
        project.members.push(userId);
        await project.save();

        res.json({ message: 'Member added successfully', project });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;