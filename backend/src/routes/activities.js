const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getActivities,
  createActivity
} = require('../controllers/activityController');

// GET activités d'un projet (du plus récent au plus ancien)
router.get('/projects/:id/activities', auth, getActivities);

// POST créer une activité
router.post('/projects/:id/activities', auth, createActivity);

module.exports = router;