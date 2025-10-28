import React, { useState, useEffect, useRef } from 'react';
import { Send, Copy, Users, LogOut, Check } from 'lucide-react';

export default function ChatApp() {
  const [screen, setScreen] = useState('home');
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [ws, setWs] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const WS_URL = 'ws://localhost:3001';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setRoomId(room);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'history':
          setMessages(data.messages);
          setUsers(data.users);
          break;

        case 'message':
          setMessages(prev => [...prev, data.message]);
          break;

        case 'user_joined':
          setUsers(data.users);
          break;

        case 'user_left':
          setUsers(data.users);
          break;

        case 'typing':
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (data.isTyping) {
              newSet.add(data.username);
            } else {
              newSet.delete(data.username);
            }
            return newSet;
          });
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.username);
              return newSet;
            });
          }, 3000);
          break;

        case 'error':
          alert(data.message);
          leaveRoom();
          break;
      }
    };

    ws.onerror = () => {
      alert('Connection error. Please try again.');
    };

    ws.onclose = () => {
      if (screen === 'chat') {
        alert('Disconnected from server');
        leaveRoom();
      }
    };
  }, [ws, screen]);

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
  };

  const copyLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const joinRoom = () => {
    if (!roomId || !username) return;

    try {
      const websocket = new WebSocket(WS_URL);
      
      websocket.onopen = () => {
        websocket.send(JSON.stringify({
          type: 'join',
          roomId,
          username
        }));
        setWs(websocket);
        setScreen('chat');
      };

      websocket.onerror = () => {
        alert('Could not connect to server. Make sure the server is running on port 3001.');
      };
    } catch (err) {
      alert('Connection failed. Please ensure the server is running.');
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !ws) return;

    ws.send(JSON.stringify({
      type: 'message',
      text: inputMessage
    }));

    setInputMessage('');
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    ws.send(JSON.stringify({
      type: 'typing',
      isTyping: false
    }));
  };

  const handleTyping = (e) => {
    setInputMessage(e.target.value);
    
    if (ws && e.target.value) {
      ws.send(JSON.stringify({
        type: 'typing',
        isTyping: true
      }));
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        ws.send(JSON.stringify({
          type: 'typing',
          isTyping: false
        }));
      }, 1000);
    }
  };

  const leaveRoom = () => {
    if (ws) {
      ws.close();
    }
    setWs(null);
    setMessages([]);
    setUsers([]);
    setScreen('home');
    setRoomId('');
    setUsername('');
  };

  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-600 mb-2">QuickChat</h1>
            <p className="text-gray-600">Instant, anonymous group chats</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter room code"
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none uppercase"
                />
                <button
                  onClick={createRoom}
                  className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                >
                  Create
                </button>
              </div>
            </div>

            {roomId && (
              <button
                onClick={copyLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-green-600" />
                    <span className="text-green-600">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy Shareable Link
                  </>
                )}
              </button>
            )}

            <button
              onClick={joinRoom}
              disabled={!roomId || !username}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
            >
              Join Room
            </button>

            <div className="text-xs text-center text-gray-500 mt-4">
              Make sure the server is running on port 3001
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Room: {roomId}</h2>
          <p className="text-sm text-gray-500">{users.length} participant{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={leaveRoom}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          <LogOut size={18} />
          Leave
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.username === username ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md ${msg.username === username ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800'} rounded-lg px-4 py-2 shadow`}>
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {msg.username}
                    </p>
                    <p className="break-words">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.username === username ? 'text-indigo-200' : 'text-gray-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {typingUsers.size > 0 && (
            <div className="px-4 py-2 text-sm text-gray-500 italic">
              {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </div>
          )}

          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={handleTyping}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="w-64 bg-white border-l border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4 text-gray-700">
            <Users size={20} />
            <h3 className="font-semibold">Participants</h3>
          </div>
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {user.username}
                  {user.username === username && ' (You)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}