const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. INSCRIPTION
exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "Ce pseudo est déjà pris !" });

    // Crypter le mot de passe (Hachage)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer l'utilisateur
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Utilisateur créé avec succès !" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 2. CONNEXION
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Utilisateur introuvable" });

    // Vérifier le mot de passe (On compare le texte brut avec le crypté)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Mot de passe incorrect" });

    // Générer le BADGE (Token JWT)
    const token = jwt.sign(
      { id: user._id }, // On met l'ID de l'utilisateur dans le badge
      process.env.JWT_SECRET, // On signe avec notre secret
      { expiresIn: '30d' } // Le badge expire dans 30 jours
    );

    // On renvoie le token et le pseudo au client
    res.json({ token, username: user.username });

  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};