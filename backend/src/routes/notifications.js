const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const notifController = require('../controllers/notifController');

router.get('/', auth, notifController.getNotifications);
router.patch('/:id/read', auth, notifController.markAsRead);

module.exports = router;