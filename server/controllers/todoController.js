const Todo = require('../models/Todo');
const User = require('../models/User');
const CryptoJS = require("crypto-js");

// --- UTILITAIRE DÉCRYPTAGE ---
const decryptText = (ciphertext) => {
    try {
        if (!ciphertext) return "";
        const bytes = CryptoJS.AES.decrypt(ciphertext, process.env.CRYPTO_SECRET);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText || ciphertext;
    } catch (e) { return ciphertext; }
};

// --- LOGIQUE STREAK (MISE À JOUR ACTIVE) ---
// Appelée quand on coche une tâche
const updateStreak = async (userId) => {
    const user = await User.findById(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    let lastDate = user.lastActive ? new Date(user.lastActive) : null;
    if (lastDate) lastDate.setHours(0, 0, 0, 0);

    // Si c'est aujourd'hui : on ne change rien
    if (lastDate && lastDate.getTime() === today.getTime()) {
        return user.streak;
    }

    // Si c'est hier : +1
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastDate && lastDate.getTime() === yesterday.getTime()) {
        user.streak += 1;
    } else {
        // Sinon (raté hier ou avant) : on redémarre à 1
        user.streak = 1;
    }

    user.lastActive = new Date();
    await user.save();
    return user.streak;
};

// 1. LIRE LES TÂCHES (ET VÉRIFIER LE STREAK PASSIF)
exports.getTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ owner: req.user.id }).sort({ order: 1 });
    const user = await User.findById(req.user.id);

    // --- CORRECTION ICI : VÉRIFICATION PASSIVE ---
    // On vérifie si le streak doit être remis à zéro car l'utilisateur a raté hier
    if (user.lastActive) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastDate = new Date(user.lastActive);
        lastDate.setHours(0, 0, 0, 0);

        // Calcul de la différence en jours
        const diffTime = today - lastDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Si plus d'1 jour d'écart (donc il n'est pas venu hier), on remet à 0
        if (diffDays > 1 && user.streak > 0) {
            user.streak = 0;
            await user.save();
        }
    }

    const decryptedTodos = todos.map(todo => {
        const todoObj = todo.toObject();
        todoObj.text = decryptText(todo.text);
        return todoObj;
    });

    res.json({ todos: decryptedTodos, streak: user.streak || 0 });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erreur lecture" });
  }
};

// 2. CRÉER
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
  } catch (err) { res.status(500).json({ message: "Erreur création" }); }
};

// 3. SUPPRIMER
exports.deleteTodo = async (req, res) => {
  try {
    const result = await Todo.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    res.json(result);
  } catch (err) { res.status(500).json({ message: "Erreur suppression" }); }
};

// 4. COCHER (Met à jour le streak)
exports.completeTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, owner: req.user.id });
    if (todo) {
        let newStreak = null;
        // Si on valide la tâche, on déclenche la logique de mise à jour active
        if (!todo.complete) {
            newStreak = await updateStreak(req.user.id);
        }

        todo.complete = !todo.complete;
        await todo.save();
        
        const todoResponse = todo.toObject();
        todoResponse.text = decryptText(todo.text);
        
        res.json({ todo: todoResponse, newStreak });
    } else {
        res.status(404).json({ message: "Introuvable" });
    }
  } catch (err) { res.status(500).json({ message: "Erreur validation" }); }
};

// 5. MODIFIER
exports.editTodo = async (req, res) => {
  try {
    const { text, isPublic } = req.body;
    const encryptedText = CryptoJS.AES.encrypt(text, process.env.CRYPTO_SECRET).toString();

    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { text: encryptedText, isPublic }, 
      { new: true } 
    );

    const todoResponse = updatedTodo.toObject();
    todoResponse.text = text;
    res.json(todoResponse);
  } catch (err) { res.status(500).json({ message: "Erreur modification" }); }
};

// 6. ORDRE
exports.reorderTodos = async (req, res) => {
  try {
    const { todos } = req.body;
    for (let i = 0; i < todos.length; i++) {
      await Todo.findOneAndUpdate({ _id: todos[i]._id, owner: req.user.id }, { order: i });
    }
    res.json({ message: "Ordre mis à jour" });
  } catch (err) { res.status(500).json({ message: "Erreur ordre" }); }
};