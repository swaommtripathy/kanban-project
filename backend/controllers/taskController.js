const Task = require('../models/Task');

// PATCH /tasks/:id - Used for moving tasks or editing titles
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    // We expect list_id or position in the body for drag-and-drop
    const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /tasks - Create a new task in a list
exports.createTask = async (req, res) => {
  try {
    const { list_id, title, position } = req.body;
    const newTask = new Task({ list_id, title, position });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};