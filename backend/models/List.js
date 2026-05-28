const mongoose = require('mongoose');

const ListSchema = new mongoose.Schema({
  board_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true }, // [cite: 36]
  title: { type: String, required: true }, // [cite: 37]
  position: { type: Number, required: true } // [cite: 38]
});

module.exports = mongoose.model('List', ListSchema);