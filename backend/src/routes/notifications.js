const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
        .sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur : " + err.message });
    }
});

router.patch("/:id/read", auth, async (req, res) => {
    try {
        const updated = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ error: "Notification introuvable" });
        }
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur: " + err.message });
    }
});

router.post("/", auth, async (req, res) => {
    try {
        const { message, type } = req.body;
        const newNotif = new Notification({
            userId: req.user.id,
            message,
            type: type || "autre"
        });
        const saved = await newNotif.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur : " + err.message });
    }
});

module.exports = router;