const Notification = require('../models/notification');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { lu: true });
    res.json({ message: 'Notification marquée comme lue' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};