const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Route bach t-inviter chi 3odw l-proje
router.post('/:id/invite', auth, async (req, res) => {
    try {
        const { email } = req.body;
        const project = await Project.findById(req.params.id);

        // Check: wach had l-user huwa mol l-proje (Owner)
        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({ msg: "Accès refusé: khasek tkun mol l-proje." });
        }

        // Nqalbo 3la l-user f la base de données
        const userToInvite = await User.findOne({ email });
        if (!userToInvite) return res.status(404).json({ msg: "User mat-lqach" });

        // Check: wach deja kyen f l-proje bach man-ziduhch mra khra
        if (project.members.includes(userToInvite._id)) return res.status(400).json({ msg: "Deja member" });

        // Zid l-user l-list dl-members
        project.members.push(userToInvite._id);
        await project.save();
        res.json(project);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Route bach t-hiyed 3odw mn l-proje
router.delete('/:id/members/:memberId', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        // Check: wach l-user huwa mol l-proje (Owner)
        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({ msg: "Accès refusé: khasek tkun mol l-proje." });
        }

        // Hiyed l-member mn l-list
        project.members = project.members.filter(m => m.toString() !== req.params.memberId);
        await project.save();
        res.json(project);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;