const express = require('express');
const router = express.Router();
const controller = require('../controllers/socialController');
const { protect } = require('../middleware/authMiddleware');

// 1. Recherche et Classement 
router.get('/search', protect, controller.searchUsers);
router.get('/leaderboard', protect, controller.getLeaderboard);

// 2. Suppression 
router.post('/remove', protect, controller.removeFriend);

// 3. On remplace l'ancien '/add'
router.post('/request/send', protect, controller.sendFriendRequest);   // Envoyer une demande
router.get('/request/list', protect, controller.getFriendRequests);    // Voir mes demandes
router.post('/request/accept', protect, controller.acceptFriendRequest); // Accepter une demande
router.get('/todos/:friendId', protect, controller.getFriendTodos);      // Voir les tâches d'un ami

module.exports = router;