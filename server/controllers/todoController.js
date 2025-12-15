const Todo = require('../models/Todo');
// 1. Import de la librairie
const CryptoJS = require("crypto-js");

// Fonction utilitaire pour Décrypter
const decryptText = (ciphertext) => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, process.env.CRYPTO_SECRET);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText || "Donnée corrompue";
    } catch (e) {
        return "Erreur lecture";
    }
};

// --- CONTROLLERS ---

exports.getTodos = async (req, res) => {
  const todos = await Todo.find({ owner: req.user.id }).sort({ order: 1 });

  // 2. On décrypte chaque tâche avant de l'envoyer au Frontend
  const decryptedTodos = todos.map(todo => {
      // On convertit le document Mongoose en objet JavaScript simple
      const todoObj = todo.toObject();
      // On remplace le texte chiffré par le texte clair
      todoObj.text = decryptText(todo.text);
      return todoObj;
  });

  res.json(decryptedTodos);
};

exports.createTodo = async (req, res) => {
  // 3. On crypte le texte AVANT de créer l'objet
  const encryptedText = CryptoJS.AES.encrypt(req.body.text, process.env.CRYPTO_SECRET).toString();

  const newTodo = new Todo({
    text: encryptedText, // On sauvegarde du charabia
    owner: req.user.id
  });
  await newTodo.save();

  // On renvoie la version décryptée au client pour l'affichage immédiat
  const todoResponse = newTodo.toObject();
  todoResponse.text = req.body.text; 
  
  res.json(todoResponse);
};

exports.deleteTodo = async (req, res) => {
  const result = await Todo.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  res.json(result);
};

exports.completeTodo = async (req, res) => {
  const todo = await Todo.findOne({ _id: req.params.id, owner: req.user.id });
  if(todo) {
      todo.complete = !todo.complete;
      await todo.save();
  }
  // On renvoie la tâche avec le texte décrypté
  const todoResponse = todo.toObject();
  todoResponse.text = decryptText(todo.text);
  res.json(todoResponse);
};

exports.editTodo = async (req, res) => {
    // On crypte le nouveau texte
    const encryptedText = CryptoJS.AES.encrypt(req.body.text, process.env.CRYPTO_SECRET).toString();

    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { text: encryptedText },
      { new: true } 
    );

    // On renvoie le texte clair au client
    const todoResponse = updatedTodo.toObject();
    todoResponse.text = req.body.text;

    res.json(todoResponse);
};

exports.reorderTodos = async (req, res) => {
  const { todos } = req.body;
  for (let i = 0; i < todos.length; i++) {
    await Todo.findOneAndUpdate(
        { _id: todos[i]._id, owner: req.user.id }, 
        { order: i }
    );
  }
  res.json({ message: "Ordre mis à jour" });
};