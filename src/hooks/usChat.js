// hooks/useChat.js
import { useState, useEffect, useRef } from "react";

export const useChat = (WS_URL) => {
  const [screen, setScreen] = useState("home");
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [ws, setWs] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Get room from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    if (room) setRoomId(room);
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket listeners
  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "history":
          setMessages(data.messages);
          setUsers(data.users);
          break;

        case "message":
          setMessages((prev) => [...prev, data.message]);
          break;

        case "user_joined":
        case "user_left":
          setUsers(data.users);
          break;

        case "typing":
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            data.isTyping ? newSet.add(data.username) : newSet.delete(data.username);
            return newSet;
          });
          setTimeout(() => {
            setTypingUsers((prev) => {
              const s = new Set(prev);
              s.delete(data.username);
              return s;
            });
          }, 3000);
          break;

        case "error":
          alert(data.message);
          leaveRoom();
          break;
      }
    };

    ws.onerror = () => alert("Connection error!");
    ws.onclose = () => screen === "chat" && leaveRoom();
  }, [ws, screen]);

  const createRoom = () =>
    setRoomId(Math.random().toString(36).substring(2, 8).toUpperCase());

  const copyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}${window.location.pathname}?room=${roomId}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const joinRoom = () => {
    if (!roomId || !username) return;

    try {
      const websocket = new WebSocket(WS_URL);

      websocket.onopen = () => {
        websocket.send(JSON.stringify({ type: "join", roomId, username }));
        setWs(websocket);
        setScreen("chat");
      };

      websocket.onerror = () => alert("Unable to connect!");
    } catch (err) {
      alert("Connection failed.");
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !ws) return;

    ws.send(JSON.stringify({ type: "message", text: inputMessage }));
    setInputMessage("");

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    ws.send(JSON.stringify({ type: "typing", isTyping: false }));
  };

  const handleTyping = (e) => {
    setInputMessage(e.target.value);

    if (ws && e.target.value) {
      ws.send(JSON.stringify({ type: "typing", isTyping: true }));

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        ws.send(JSON.stringify({ type: "typing", isTyping: false }));
      }, 1000);
    }
  };

  const leaveRoom = () => {
    ws && ws.close();
    setWs(null);
    setMessages([]);
    setUsers([]);
    setScreen("home");
    setRoomId("");
    setUsername("");
  };

  return {
    screen,
    setScreen,
    roomId,
    setRoomId,
    username,
    setUsername,
    messages,
    users,
    inputMessage,
    typingUsers,
    copied,
    messagesEndRef,

    createRoom,
    copyLink,
    joinRoom,
    sendMessage,
    handleTyping,
    leaveRoom,
  };
};
