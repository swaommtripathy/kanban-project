const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
  name: { type: String, required: true }, // [cite: 23]
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // [cite: 24]
  members: [{
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // [cite: 29]
    role: { type: String, enum: ['admin', 'member'], default: 'member' } // [cite: 30]
  }],
  createdAt: { type: Date, default: Date.now } // [cite: 25]
});

module.exports = mongoose.model('Board', BoardSchema);