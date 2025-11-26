const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;

  // On vérifie si le header contient "Authorization: Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // On récupère le token (on enlève le mot "Bearer ")
      token = req.headers.authorization.split(' ')[1];

      // On décrypte le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // On ajoute l'ID de l'utilisateur à la requête
      req.user = { id: decoded.id };

      next(); // On laisse passer la requête vers le contrôleur
    } catch (error) {
      res.status(401).json({ message: "Token non valide" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Pas de token, accès refusé" });
  }
};

module.exports = { protect };