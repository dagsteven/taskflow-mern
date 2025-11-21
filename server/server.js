// Load environment variables from .env file in local development
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const todoRoutes = require('./routes/todoRoutes');

const app = express();

// Deployment Config: PORT is assigned by the host (Render/Heroku), fallback to 5000 for local
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Deployment Config: CORS
// En production, Render (Backend) et Vercel (Frontend) sont sur des domaines différents.
// On autorise tout le monde (*) pour ce premier déploiement pour éviter les erreurs de blocage.
// Plus tard, tu pourras remplacer '*' par l'URL de ton front Vercel (ex: 'https://mon-app.vercel.app')
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type']
}));

// Deployment Config: MongoDB Atlas Connection
// 1. Récupère l'URI depuis les variables d'environnement (Render)
// 2. Sinon, utilise la base locale (Développement)
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mern-vite-todo';

// Vérification de sécurité pour aider au débogage sur Render
if (!process.env.MONGO_URI && process.env.NODE_ENV === 'production') {
  console.error("⚠️ ATTENTION : Aucune variable MONGO_URI détectée ! L'application tente de se connecter à localhost, ce qui échouera sur Render.");
}

mongoose.connect(mongoURI)
  .then(() => console.log(`✅ MongoDB connecté sur : ${mongoURI.includes('localhost') || mongoURI.includes('127.0.0.1') ? 'Localhost' : 'Atlas Cloud'}`))
  .catch((err) => console.error("❌ Erreur connexion DB:", err));

app.use('/api', todoRoutes);

app.listen(PORT, () => console.log(`🚀 Serveur sur le port ${PORT}`));