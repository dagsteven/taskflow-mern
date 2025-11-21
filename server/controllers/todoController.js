const Todo = require('../models/Todo');

// Lire les tâches (TRIÉES PAR ORDRE)
exports.getTodos = async (req, res) => {
  // .sort({ order: 1 }) signifie : trier par numéro d'ordre croissant
  const todos = await Todo.find().sort({ order: 1 });
  res.json(todos);
};

// Créer une tâche
exports.createTodo = async (req, res) => {
  const newTodo = new Todo({
    text: req.body.text
  });
  await newTodo.save();
  res.json(newTodo);
};

// Supprimer une tâche
exports.deleteTodo = async (req, res) => {
  const result = await Todo.findByIdAndDelete(req.params.id);
  res.json(result);
};

// Modifier statut
exports.completeTodo = async (req, res) => {
  const todo = await Todo.findById(req.params.id);
  todo.complete = !todo.complete;
  await todo.save();
  res.json(todo);
};

// Réorganiser les tâches
exports.reorderTodos = async (req, res) => {
  const { todos } = req.body;
  
  // On reçoit la liste complète dans le nouvel ordre
  // On met à jour l'index 'order' de chaque tâche dans la DB
  for (let i = 0; i < todos.length; i++) {
    await Todo.findByIdAndUpdate(todos[i]._id, { order: i });
  }
  
  res.json({ message: "Ordre mis à jour" });
};