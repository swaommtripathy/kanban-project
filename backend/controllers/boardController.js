const Board = require('../models/Board');
const List = require('../models/List');
const Task = require('../models/Task');
const mongoose = require('mongoose');

// GET /boards - Fetches all boards for the current user
exports.getAllBoards = async (req, res) => {
  try {
    const userId = req.user.id;
    const boards = await Board.find({
      $or: [
        { owner_id: userId },
        { 'members.user_id': userId }
      ]
    }).sort({ createdAt: -1 });
    
    res.json(boards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /boards/:id - Fetches board with all its lists and tasks.
exports.getBoardById = async (req, res) => {
  try {
    const { id } = req.params;
    const board = await Board.findById(id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    // Aggregate lists and their tasks in one go
    const data = await List.aggregate([
      { $match: { board_id: new mongoose.Types.ObjectId(id) } },
      { $sort: { position: 1 } },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'list_id',
          as: 'tasks'
        }
      },
      {
        $addFields: {
          tasks: {
            $sortArray: { input: '$tasks', sortBy: { position: 1 } }
          }
        }
      }
    ]);

    res.json({ board, lists: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /boards - Create a new board
exports.createBoard = async (req, res) => {
  try {
    const { name } = req.body;
    const newBoard = new Board({
      name,
      owner_id: req.user.id,
      members: [{ user_id: req.user.id, role: 'admin' }]
    });
    await newBoard.save();
    res.status(201).json(newBoard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /boards/:id - Update board name
exports.updateBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const board = await Board.findById(id);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (board.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to update this board' });
    }

    board.name = name?.trim() ? name.trim() : board.name;
    await board.save();
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /boards/:id - Remove board and its related lists/tasks
exports.deleteBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const board = await Board.findById(id);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (board.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this board' });
    }

    const lists = await List.find({ board_id: board._id });
    const listIds = lists.map((list) => list._id);

    await Task.deleteMany({ list_id: { $in: listIds } });
    await List.deleteMany({ board_id: board._id });
    await Board.findByIdAndDelete(id);

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};