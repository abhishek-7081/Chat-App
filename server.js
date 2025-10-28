import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// In-memory storage
const rooms = new Map(); // roomId -> { users: Map, messages: [] }

// Generate random room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create new room
app.post('/api/room/create', (req, res) => {
  const roomId = generateRoomCode();
  rooms.set(roomId, { users: new Map(), messages: [] });
  res.json({ roomId });
});

// Check if room exists
app.get('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const exists = rooms.has(roomId);
  res.json({ exists });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  let currentRoom = null;
  let currentUser = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'join':
          const { roomId, username } = message;
          
          if (!rooms.has(roomId)) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Room not found' 
            }));
            return;
          }

          currentRoom = roomId;
          currentUser = { id: Date.now().toString(), username };
          
          const room = rooms.get(roomId);
          room.users.set(currentUser.id, { username, ws });

          // Send room history to new user
          ws.send(JSON.stringify({
            type: 'history',
            messages: room.messages,
            users: Array.from(room.users.values()).map(u => ({
              id: u.username,
              username: u.username
            }))
          }));

          // Notify others about new user
          broadcastToRoom(roomId, {
            type: 'user_joined',
            username,
            users: Array.from(room.users.values()).map(u => ({
              id: u.username,
              username: u.username
            }))
          }, ws);

          break;

        case 'message':
          if (!currentRoom || !currentUser) return;

          const chatMessage = {
            id: Date.now().toString(),
            username: currentUser.username,
            text: message.text,
            timestamp: new Date().toISOString()
          };

          const roomData = rooms.get(currentRoom);
          roomData.messages.push(chatMessage);

          // Broadcast message to all users in room
          broadcastToRoom(currentRoom, {
            type: 'message',
            message: chatMessage
          });

          break;

        case 'typing':
          if (!currentRoom || !currentUser) return;
          
          broadcastToRoom(currentRoom, {
            type: 'typing',
            username: currentUser.username,
            isTyping: message.isTyping
          }, ws);
          
          break;
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoom && currentUser) {
      const room = rooms.get(currentRoom);
      if (room) {
        room.users.delete(currentUser.id);

        // Notify others about user leaving
        broadcastToRoom(currentRoom, {
          type: 'user_left',
          username: currentUser.username,
          users: Array.from(room.users.values()).map(u => ({
            id: u.username,
            username: u.username
          }))
        });

        // Clean up empty rooms
        if (room.users.size === 0) {
          rooms.delete(currentRoom);
        }
      }
    }
  });
});

function broadcastToRoom(roomId, message, excludeWs = null) {
  const room = rooms.get(roomId);
  if (!room) return;

  const messageStr = JSON.stringify(message);
  room.users.forEach((user) => {
    if (user.ws !== excludeWs && user.ws.readyState === 1) {
      user.ws.send(messageStr);
    }
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});