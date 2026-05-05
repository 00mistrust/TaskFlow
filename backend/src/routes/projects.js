const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const authMiddleware = require('../middleware/auth'); // تأكد من المسار ديال الميدل وير


router.use(authMiddleware);


router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const projects = await Project.find({ owner: req.user.id }) // كنقلبو غير على مشاريع هاد المستخدم
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

// POST: صاوب مشروع جديد
router.post('/', async (req, res) => {
    try {
        const { title, description, deadline } = req.body;
        const newProject = new Project({
            title,
            description,
            deadline,
            owner: req.user.id // هاد الـ ID كيجي من الـ Middleware
        });

        await newProject.save();
        res.status(201).json(newProject);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT: عدل مشروع
router.put('/:id', async (req, res) => {
    try {
        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.id }, // كنتاكدو باللي هو مولاه
            req.body,
            { new: true }
        );
        if (!project) return res.status(404).json({ error: 'Project non trouvé' });
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE: مسح مشروع
router.delete('/:id', async (req, res) => {
    try {
        const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
        if (!project) return res.status(404).json({ error: 'Project non trouvé' });
        res.json({ message: 'Projet supprimé' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;