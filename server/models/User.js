const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Amis confirmés
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // NOUVEAU : C'est ce champ qui manquait ! 👇
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);