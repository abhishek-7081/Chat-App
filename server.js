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

console.log('🚀 Server initializing...');

// Generate random room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create new room
app.post('/api/room/create', (req, res) => {
  const roomId = generateRoomCode();
  rooms.set(roomId, { users: new Map(), messages: [] });
  console.log(`✅ Room created: ${roomId}`);
  res.json({ roomId });
});

// Check if room exists
app.get('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const exists = rooms.has(roomId);
  console.log(`🔍 Room check: ${roomId} - ${exists ? 'EXISTS' : 'NOT FOUND'}`);
  res.json({ exists });
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection established');

  let currentRoom = null;
  let currentUser = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message:', message.type, message);

      switch (message.type) {
        case 'join':
          const { roomId, username } = message;

          // Create room if it doesn't exist
          if (!rooms.has(roomId)) {
            rooms.set(roomId, { users: new Map(), messages: [] });
            console.log(`🆕 Room auto-created: ${roomId}`);
          }

          currentRoom = roomId;
          currentUser = {
            id: Date.now().toString() + Math.random(),
            username
          };

          const room = rooms.get(roomId);
          room.users.set(currentUser.id, { username, ws });

          console.log(`👤 User joined: ${username} in room ${roomId}`);
          console.log(`👥 Total users in room: ${room.users.size}`);

          // Send room history to new user
          ws.send(JSON.stringify({
            type: 'history',
            messages: room.messages,
            users: Array.from(room.users.values()).map(u => ({
              id: u.username,
              username: u.username
            }))
          }));

          console.log(`📤 Sent history to ${username}: ${room.messages.length} messages`);

          // Notify others about new user
          broadcastToRoom(roomId, {
            type: 'user_joined',
            username,
            users: Array.from(room.users.values()).map(u => ({
              id: u.username,
              username: u.username
            }))
          }, ws);

          console.log(`📢 Broadcasted user_joined for ${username}`);

          break;

        case 'message':
          if (!currentRoom || !currentUser) {
            console.log('❌ Message sent without joining room');
            return;
          }

          const chatMessage = {
            id: Date.now().toString(),
            username: currentUser.username,
            text: message.text,
            timestamp: new Date().toISOString()
          };

          const roomData = rooms.get(currentRoom);
          roomData.messages.push(chatMessage);

          console.log(`💬 Message from ${currentUser.username} in ${currentRoom}: ${message.text}`);

          // Broadcast message to all users in room
          broadcastToRoom(currentRoom, {
            type: 'message',
            message: chatMessage
          });

          console.log(`📤 Message broadcasted to ${roomData.users.size} users`);

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
      console.error('❌ Error processing message:', err);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Server error processing message'
      }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');

    if (currentRoom && currentUser) {
      const room = rooms.get(currentRoom);
      if (room) {
        room.users.delete(currentUser.id);
        console.log(`👋 User left: ${currentUser.username} from room ${currentRoom}`);
        console.log(`👥 Remaining users: ${room.users.size}`);

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
          console.log(`🗑️ Empty room deleted: ${currentRoom}`);
        }
      }
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

function broadcastToRoom(roomId, message, excludeWs = null) {
  const room = rooms.get(roomId);
  if (!room) {
    console.log(`⚠️ Cannot broadcast to non-existent room: ${roomId}`);
    return;
  }

  const messageStr = JSON.stringify(message);
  let sentCount = 0;

  room.users.forEach((user) => {
    if (user.ws !== excludeWs && user.ws.readyState === 1) {
      user.ws.send(messageStr);
      sentCount++;
    }
  });

  console.log(`📡 Broadcast: ${message.type} to ${sentCount} users in room ${roomId}`);
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ WebSocket server ready on ws://localhost:${PORT}`);
  console.log(`📊 Rooms in memory: ${rooms.size}`);
});