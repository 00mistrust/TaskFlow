const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// GET all projects
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE project
router.post('/', async (req, res) => {
    try {
        const { title, description, deadline } = req.body;

        const newProject = new Project({
            title,
            description,
            deadline
        });

        await newProject.save();
        res.status(201).json(newProject);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;