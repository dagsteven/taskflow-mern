const express = require('express');
const router = express.Router();
const controller = require('../controllers/todoController');
const { protect } = require('../middleware/authMiddleware'); // Import du vigile

router.get('/todos', protect, controller.getTodos);
router.post('/todos/new', protect, controller.createTodo);
router.delete('/todos/delete/:id', protect, controller.deleteTodo);
router.put('/todos/complete/:id', protect, controller.completeTodo);
router.put('/todos/reorder', protect, controller.reorderTodos);
router.put('/todos/edit/:id', protect, controller.editTodo);

module.exports = router;