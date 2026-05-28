const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  list_id: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true }, // [cite: 47]
  title: { type: String, required: true }, // [cite: 48]
  description: { type: String, default: '' }, // [cite: 49]
  assigned_to: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // [cite: 50]
  due_date: { type: Date }, // [cite: 50]
  position: { type: Number, required: true }, // [cite: 51]
  createdAt: { type: Date, default: Date.now } // [cite: 52]
});

module.exports = mongoose.model('Task', TaskSchema);