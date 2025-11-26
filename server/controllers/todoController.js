const Todo = require('../models/Todo');

// Lire UNIQUEMENT les tâches de l'utilisateur connecté
exports.getTodos = async (req, res) => {
  // req.user.id vient du Middleware qu'on a créé
  const todos = await Todo.find({ owner: req.user.id }).sort({ order: 1 });
  res.json(todos);
};

// Créer une tâche en l'assignant à l'utilisateur
exports.createTodo = async (req, res) => {
  const newTodo = new Todo({
    text: req.body.text,
    owner: req.user.id // <--- On met le tampon du propriétaire
  });
  await newTodo.save();
  res.json(newTodo);
};

// Supprimer (Vérifier que c'est bien MA tâche)
exports.deleteTodo = async (req, res) => {
  const result = await Todo.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  res.json(result);
};

// Compléter (Vérifier que c'est bien MA tâche)
exports.completeTodo = async (req, res) => {
  const todo = await Todo.findOne({ _id: req.params.id, owner: req.user.id });
  if(todo) {
      todo.complete = !todo.complete;
      await todo.save();
  }
  res.json(todo);
};

// Réorganiser (Uniquement MES tâches)
exports.reorderTodos = async (req, res) => {
  const { todos } = req.body;
  for (let i = 0; i < todos.length; i++) {
    // On ajoute la sécurité owner ici aussi
    await Todo.findOneAndUpdate(
        { _id: todos[i]._id, owner: req.user.id }, 
        { order: i }
    );
  }
  res.json({ message: "Ordre mis à jour" });
};