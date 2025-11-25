// ChatApp.jsx
import HomeScreen from "./components/Homescreen.jsx";
import ChatScreen from "./components/Chatscreen.jsx";
import { useChat } from "./hooks/useChat.js";

export default function ChatApp() {
  const WS_URL = "ws://localhost:3001";

  const chat = useChat(WS_URL);

  return chat.screen === "home" ? (
    <HomeScreen {...chat} />
  ) : (
    <ChatScreen {...chat} />
  );
}
