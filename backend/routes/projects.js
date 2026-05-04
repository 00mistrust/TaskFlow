const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// GET: جلب جميع المشاريع
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;