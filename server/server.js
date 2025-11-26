require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const todoRoutes = require('./routes/todoRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Route racine pour UptimeRobot
app.get('/', (req, res) => {
  res.send('Le serveur TaskFlow est en ligne ! 🚀');
});

app.use(express.json());
app.use(cors());

// Connexion au Cloud (MongoDB Atlas)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connecté")) // Si ça marche
  .catch((err) => console.error("❌ Erreur de connexion:", err)); // Si ça plante

app.use('/api/auth', authRoutes);
app.use('/api', todoRoutes);

app.listen(PORT, () => console.log(`🚀 Serveur sur le port ${PORT}`));