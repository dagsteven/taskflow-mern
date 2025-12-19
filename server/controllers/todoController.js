const Todo = require('../models/Todo');
const User = require('../models/User'); // <--- IMPORT NÉCESSAIRE
const CryptoJS = require("crypto-js");

// --- FONCTION UTILITAIRE DE DÉCRYPTAGE ---
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

// --- FONCTION UTILITAIRE : GESTION DES FLAMMES ---
const updateStreak = async (userId) => {
    const user = await User.findById(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // On remet à minuit pour comparer juste les jours

    let lastDate = user.lastActive ? new Date(user.lastActive) : null;
    if (lastDate) lastDate.setHours(0, 0, 0, 0);

    // 1. Si dernière activité = Aujourd'hui -> On ne fait rien
    if (lastDate && lastDate.getTime() === today.getTime()) {
        return user.streak;
    }

    // 2. Si dernière activité = Hier -> On augmente la flamme
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastDate && lastDate.getTime() === yesterday.getTime()) {
        user.streak += 1;
    } else {
        // 3. Sinon (première fois ou série brisée) -> On commence à 1
        user.streak = 1;
    }

    user.lastActive = new Date(); // On met à jour la date d'activité
    await user.save();
    return user.streak;
};


// 1. LIRE LES TÂCHES
exports.getTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ owner: req.user.id }).sort({ order: 1 });
    const user = await User.findById(req.user.id); // On récupère aussi l'info streak

    const decryptedTodos = todos.map(todo => {
        const todoObj = todo.toObject();
        todoObj.text = decryptText(todo.text);
        return todoObj;
    });

    // On renvoie les tâches ET le streak actuel
    res.json({ todos: decryptedTodos, streak: user.streak || 0 });
  } catch (err) {
    res.status(500).json({ message: "Erreur lecture" });
  }
};

// 2. CRÉER UNE TÂCHE
exports.createTodo = async (req, res) => {
  try {
    const { text, isPublic } = req.body;
    const encryptedText = CryptoJS.AES.encrypt(text, process.env.CRYPTO_SECRET).toString();

    const newTodo = new Todo({
      text: encryptedText,
      isPublic: isPublic || false,
      owner: req.user.id
    });
    
    await newTodo.save();

    const todoResponse = newTodo.toObject();
    todoResponse.text = text; 
    
    res.json(todoResponse);
  } catch (err) {
    res.status(500).json({ message: "Erreur création" });
  }
};

// 3. SUPPRIMER
exports.deleteTodo = async (req, res) => {
  try {
    const result = await Todo.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Erreur suppression" });
  }
};

// 4. VALIDER/COCHÉE (Avec gestion des Flammes 🔥)
exports.completeTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, owner: req.user.id });
    
    if (todo) {
        // Si on coche la tâche (elle passe à True), on met à jour le streak
        let newStreak = null;
        if (!todo.complete) {
            newStreak = await updateStreak(req.user.id);
        }

        todo.complete = !todo.complete;
        await todo.save();
        
        const todoResponse = todo.toObject();
        todoResponse.text = decryptText(todo.text);
        
        // On renvoie le nouveau streak au frontend
        res.json({ todo: todoResponse, newStreak });
    } else {
        res.status(404).json({ message: "Tâche introuvable" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erreur validation" });
  }
};

// 5. MODIFIER
exports.editTodo = async (req, res) => {
  try {
    const { text, isPublic } = req.body;
    const encryptedText = CryptoJS.AES.encrypt(text, process.env.CRYPTO_SECRET).toString();

    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { text: encryptedText, isPublic: isPublic }, 
      { new: true } 
    );

    const todoResponse = updatedTodo.toObject();
    todoResponse.text = text;

    res.json(todoResponse);
  } catch (err) {
    res.status(500).json({ message: "Erreur modification" });
  }
};

// 6. RÉORGANISER
exports.reorderTodos = async (req, res) => {
  try {
    const { todos } = req.body;
    for (let i = 0; i < todos.length; i++) {
      await Todo.findOneAndUpdate(
          { _id: todos[i]._id, owner: req.user.id }, 
          { order: i }
      );
    }
    res.json({ message: "Ordre mis à jour" });
  } catch (err) {
    res.status(500).json({ message: "Erreur ordre" });
  }
};