const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Amis & Demandes
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // --- SYSTÈME DE STREAKS (FLAMMES) ---
  streak: { type: Number, default: 0 }, // Combien de jours d'affilée
  lastActive: { type: Date, default: null }, // Date de la dernière tâche accomplie
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);