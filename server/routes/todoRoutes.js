const express = require('express');
const router = express.Router();
const controller = require('../controllers/todoController');

// On relie l'URL à la fonction du contrôleur
router.get('/todos', controller.getTodos);
router.post('/todos/new', controller.createTodo);
router.delete('/todos/delete/:id', controller.deleteTodo);
router.put('/todos/complete/:id', controller.completeTodo);
router.put('/todos/reorder', controller.reorderTodos); 

module.exports = router;