const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const dashboardRoutes = require('./src/routes/dashboard');
const taskRoutes = require('./src/routes/tasks');
const activityRoutes = require('./src/routes/activities');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connecté'))
  .catch(err => console.error(err));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', require('./src/routes/tasks'));
app.use('/api/dashboard', require('./src/routes/dashboard'));
app.use('/api/projects', require('./src/routes/projects'));

app.get('/', (req, res) => res.json({ message: 'Nice Job Team, pround of you ALL, now time to show up !' }));

app.listen(process.env.PORT, () => {
  console.log(`Serveur lancé sur le port ${process.env.PORT}`);
});
