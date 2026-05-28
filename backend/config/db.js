// backend/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  // Add a console log here to see what is actually being seen by the code
  console.log("Attempting to connect with URI:", process.env.MONGO_URI);

  if (!process.env.MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI is not defined in your .env file!");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected Successfully...');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;