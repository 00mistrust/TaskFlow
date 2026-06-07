const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    // On récupère motDePasse OU password si le frontend a envoyé password
    const { nom, email, motDePasse, password } = req.body;
    const finalPassword = motDePasse || password;

    if (!finalPassword) {
      return res.status(400).json({ error: "Le mot de passe est requis." });
    }

    const hashed = await bcrypt.hash(finalPassword, 10);
    
    // Le modèle Mongoose attend toujours 'motDePasse'
    const user = await User.create({ nom, email, motDePasse: hashed }); 
    
    return res.status(201).json({ message: 'Compte créé avec succès' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const valid = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token: token, 
      nom: user.nom
     });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};