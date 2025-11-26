const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Pseudo unique
  password: { type: String, required: true }, // Mot de passe (sera crypté)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);