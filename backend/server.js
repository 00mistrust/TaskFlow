const express = require('express');
const mongoose = require('mongoose');
const taskRoutes = require('./routes/tasks');

const app = express();
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/taskflow')
.then(() => console.log('MongoDB connecté'))
  .catch(err => console.error(err));

app.use(taskRoutes);

app.listen(3000, () => {
  console.log('Serveur démarré sur http://localhost:3000');
});
