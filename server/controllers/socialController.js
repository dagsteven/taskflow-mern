const User = require('../models/User');
const Todo = require('../models/Todo'); // <--- AJOUT IMPORTANT ICI

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

// A. Envoyer une demande d'ami
exports.sendFriendRequest = async (req, res) => {
  try {
    const { username } = req.body;
    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findOne({ username });

    if (!targetUser) return res.status(404).json({ message: "Utilisateur introuvable" });
    if (currentUser.username === username) return res.status(400).json({ message: "C'est vous..." });

    // Vérifications
    if (currentUser.friends.includes(targetUser._id)) return res.status(400).json({ message: "Déjà amis !" });
    if (targetUser.friendRequests.includes(currentUser._id)) return res.status(400).json({ message: "Demande déjà envoyée" });
    
    // Cas où l'autre m'a déjà envoyé une demande -> On devient amis direct ? (Optionnel, ici on garde simple)
    
    // ACTION : Ajouter mon ID dans SA liste de demandes
    targetUser.friendRequests.push(currentUser._id);
    await targetUser.save();

    res.json({ message: `Demande envoyée à ${targetUser.username}` });
  } catch (err) { res.status(500).json({ message: "Erreur envoi" }); }
};

// B. Voir mes demandes en attente
exports.getFriendRequests = async (req, res) => {
  try {
    // On récupère l'utilisateur et on "déplie" (populate) les infos des demandeurs
    const user = await User.findById(req.user.id).populate('friendRequests', 'username');
    res.json(user.friendRequests);
  } catch (err) { res.status(500).json({ message: "Erreur récupération" }); }
};

// C. Accepter une demande
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { requesterId } = req.body; // L'ID de celui qui a fait la demande
    const currentUser = await User.findById(req.user.id);
    const requester = await User.findById(requesterId);

    if (!currentUser.friendRequests.includes(requesterId)) {
        return res.status(400).json({ message: "Aucune demande de cette personne" });
    }

    // 1. Ajouter aux amis (Réciproque)
    currentUser.friends.push(requesterId);
    requester.friends.push(currentUser._id);

    // 2. Retirer de la liste des demandes
    currentUser.friendRequests.pull(requesterId);

    await currentUser.save();
    await requester.save();

    res.json({ message: `Vous êtes maintenant ami avec ${requester.username} !` });
  } catch (err) { res.status(500).json({ message: "Erreur acceptation" }); }
};

// 3. Retirer un ami
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

// 4. LEADERBOARD (La fonction manquante)
exports.getLeaderboard = async (req, res) => {
  try {
    // On récupère l'utilisateur et ses amis
    const currentUser = await User.findById(req.user.id).populate('friends', 'username');
    
    // Liste : Moi + Mes Amis
    const leaderboardList = [
        { _id: currentUser._id, username: currentUser.username },
        ...currentUser.friends
    ];

    // On compte les points pour chacun
    const leaderboardWithScores = await Promise.all(
        leaderboardList.map(async (user) => {
            const score = await Todo.countDocuments({ 
                owner: user._id, 
                complete: true 
            });
            return { username: user.username, score: score };
        })
    );

    // Tri décroissant
    leaderboardWithScores.sort((a, b) => b.score - a.score);

    res.json(leaderboardWithScores);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erreur classement" });
  }
};