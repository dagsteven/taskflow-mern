const User = require('../models/User');
const Todo = require('../models/Todo');
const CryptoJS = require("crypto-js"); // <--- IL MANQUAIT SOUVENT ÇA

// --- FONCTION UTILITAIRE DE DÉCRYPTAGE (La même que dans todoController) ---
const decryptText = (ciphertext) => {
    try {
        if (!ciphertext) return "";
        const bytes = CryptoJS.AES.decrypt(ciphertext, process.env.CRYPTO_SECRET);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText || ciphertext;
    } catch (e) {
        return ciphertext;
    }
};

// 1. Rechercher des utilisateurs
exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query === "") return res.json([]);

    const users = await User.find({
        username: { $regex: query, $options: 'i' },
        _id: { $ne: req.user.id }
    })
    .limit(10)
    .select('username _id');

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Erreur recherche" });
  }
};

// 2. Envoyer une demande d'ami
exports.sendFriendRequest = async (req, res) => {
  try {
    const { username } = req.body;
    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findOne({ username });

    if (!targetUser) return res.status(404).json({ message: "Utilisateur introuvable" });
    if (currentUser.username === username) return res.status(400).json({ message: "Impossible de s'ajouter soi-même" });
    if (currentUser.friends.includes(targetUser._id)) return res.status(400).json({ message: "Déjà amis !" });
    if (targetUser.friendRequests.includes(currentUser._id)) return res.status(400).json({ message: "Demande déjà envoyée" });

    targetUser.friendRequests.push(currentUser._id);
    await targetUser.save();

    res.json({ message: `Demande envoyée à ${targetUser.username}` });
  } catch (err) {
    res.status(500).json({ message: "Erreur envoi" });
  }
};

// 3. Voir mes demandes
exports.getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('friendRequests', 'username');
    res.json(user.friendRequests);
  } catch (err) {
    res.status(500).json({ message: "Erreur récupération" });
  }
};

// 4. Accepter une demande
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { requesterId } = req.body;
    const currentUser = await User.findById(req.user.id);
    const requester = await User.findById(requesterId);

    if (!currentUser.friendRequests.includes(requesterId)) {
        return res.status(400).json({ message: "Aucune demande de cette personne" });
    }

    currentUser.friends.push(requesterId);
    requester.friends.push(currentUser._id);
    currentUser.friendRequests.pull(requesterId);

    await currentUser.save();
    await requester.save();

    res.json({ message: `Vous êtes maintenant ami avec ${requester.username} !` });
  } catch (err) {
    res.status(500).json({ message: "Erreur acceptation" });
  }
};

// 5. Retirer un ami
exports.removeFriend = async (req, res) => {
  try {
    const { username } = req.body;
    const currentUser = await User.findById(req.user.id);
    const friend = await User.findOne({ username });

    if (!friend || !currentUser.friends.includes(friend._id)) {
        return res.status(400).json({ message: "Erreur : ami introuvable" });
    }

    currentUser.friends.pull(friend._id);
    await currentUser.save();
    friend.friends.pull(currentUser._id);
    await friend.save();

    res.json({ message: `Vous n'êtes plus ami avec ${friend.username}` });
  } catch (err) {
    res.status(500).json({ message: "Erreur suppression" });
  }
};

// 6. LEADERBOARD (Classement)
exports.getLeaderboard = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).populate('friends', 'username');
    
    const leaderboardList = [
        { _id: currentUser._id, username: currentUser.username },
        ...currentUser.friends
    ];

    const leaderboardWithScores = await Promise.all(
        leaderboardList.map(async (user) => {
            const score = await Todo.countDocuments({ 
                owner: user._id, 
                complete: true,
                isPublic: true // On ne compte que les tâches publiques
            });
            return { _id: user._id, username: user.username, score: score };
        })
    );

    leaderboardWithScores.sort((a, b) => b.score - a.score);

    res.json(leaderboardWithScores);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erreur classement" });
  }
};

// 7. VOIR LES TÂCHES D'UN AMI (C'est ici qu'on ajoute le décryptage !)
exports.getFriendTodos = async (req, res) => {
    try {
        const friendId = req.params.friendId;
        
        // On cherche les tâches de cet ami qui sont PUBLIQUES
        const todos = await Todo.find({ owner: friendId, isPublic: true }).sort({ timestamp: -1 });

        // ON DÉCRYPTE CHAQUE TÂCHE AVANT DE L'ENVOYER
        const decryptedTodos = todos.map(todo => {
            const t = todo.toObject();
            t.text = decryptText(t.text);
            return t;
        });

        res.json(decryptedTodos);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Impossible de voir les tâches" });
    }
};