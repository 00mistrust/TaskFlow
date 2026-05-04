const user = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { nom, email, motDePasse } = req.body;
    const user = await user.create({ nom, email, motDePasse });
    res.status(201).json({ message: 'Compte créé avec succès' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
