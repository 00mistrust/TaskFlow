const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");

const fakeAuth = (req, res, next) => {
    requ.user = { id: "6650000000000000000test01" };
    next();
};
//GET /api/notifications
router.get("/", fakeAuth, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
        .sort({ createdAt: -1 }) // du plus récent au plus ancien
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur : " + err.message });
    }
});

//PATCH /api/notifications/:id/read
router.patch("/:id/read", fakeAuth, async (req, res) => {
    try {
        const updated = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ error: "Notification introuvable" });
        };
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur: " + err.message });
    }
});

//POST /api/notifications
router.post("/", async (req, res) => {
    try {
        const { userId, message, type } = req.body;
        const newNotif = new Notification({
            userId,
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