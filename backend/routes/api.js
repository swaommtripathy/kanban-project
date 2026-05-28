const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Ensure you have this middleware
const boardController = require('../controllers/boardController');
const taskController = require('../controllers/taskController');

// Board Routes
router.get('/boards', auth, boardController.getAllBoards);
router.post('/boards', auth, boardController.createBoard);
router.get('/boards/:id', auth, boardController.getBoardById);

// Task Routes
router.post('/tasks', auth, taskController.createTask);
router.patch('/tasks/:id', auth, taskController.updateTask);


// Added this router line inside
router.post('/lists', auth, async (req, res) => {
  try {
    const { board_id, title } = req.body;
    const List = require('../models/List');
    
    // Auto-spacing position assignment rule
    const lastList = await List.findOne({ board_id }).sort({ position: -1 });
    const position = lastList ? lastList.position + 1000 : 1000;

    const newList = new List({ board_id, title, position });
    await newList.save();
    res.status(201).json(newList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;