// backend/server.js

// 1. LOAD ENV VARIABLES FIRST
require('dotenv').config(); 

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// 2. CONNECT TO DATABASE
connectDB(); 

// 🔄 DYNAMIC CORS ORIGIN: Reads Render's configuration in production, falls back to local dev
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

// 3. GLOBAL MIDDLEWARE (Must be placed BEFORE any route attachments!)
app.use(cors({
  origin: allowedOrigin, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Essential to read incoming req.body payloads

// 4. MOUNT APPLICATION ROUTERS
app.use('/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));

// 5. INITIALIZE SOCKET.IO SERVER WITH DYNAMIC CORS
const io = new Server(server, { 
  cors: { 
    origin: allowedOrigin,
    methods: ["GET", "POST"]
  } 
});

// 6. SOCKET.IO REAL-TIME INTERACTION LOGIC
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-board', (boardId) => {
    socket.join(boardId);
    console.log(`User joined board: ${boardId}`);
  });

  socket.on('board-updated', (data) => {
    // Broadcast updates to everyone in the room except the sender
    socket.to(data.boardId).emit('ui-render-update', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Landing page and Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    status: "online",
    message: "Kanban Project API is running successfully",
    timestamp: new Date().toISOString()
  });
});

// 7. START UNIFIED LISTENING PIPELINE
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
