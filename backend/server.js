const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connecté'))
  .catch(err => console.error(err));

app.use('/api/auth', authRoutes);
// app.use('/api/tasks', require('./src/routes/tasks'));
app.use('/api/dashboard', require('./src/routes/dashboard'));
app.get('/', (req, res) => res.json({ message: 'Nice Job Team, pround of you ALL, now time to show up !' }));
// const projectRoutes = require('./backend/src/routes/projects'); membre 2
// app.use('/api/projects', projectRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Serveur lancé sur le port ${process.env.PORT}`);
});