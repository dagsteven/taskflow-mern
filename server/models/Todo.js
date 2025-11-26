const mongoose = require('mongoose');

const TodoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  complete: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  timestamp: { type: String, default: Date.now }
});

module.exports = mongoose.model('Todo', TodoSchema);