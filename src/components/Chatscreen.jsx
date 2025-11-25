// components/ChatScreen.jsx
import { Send, LogOut } from "lucide-react";
import MessageList from "./MessageList";
import ParticipantsList from "./ParticipantsList";

export default function ChatScreen({
  roomId,
  users,
  username,
  messages,
  inputMessage,
  typingUsers,
  handleTyping,
  sendMessage,
  leaveRoom,
  messagesEndRef,
}) {
  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      <div className="bg-white px-4 py-3 flex justify-between border-b">
        <div>
          <h2 className="font-bold text-xl">Room: {roomId}</h2>
          <p>{users.length} participants</p>
        </div>

        <button onClick={leaveRoom} className="px-4 py-2 bg-red-500 text-white rounded-lg flex gap-2">
          <LogOut size={18} /> Leave
        </button>
      </div>

      <div className="flex flex-1">
        <div className="flex-1 flex flex-col">
          <MessageList
            messages={messages}
            username={username}
            messagesEndRef={messagesEndRef}
          />

          {typingUsers.size > 0 && (
            <p className="px-4 py-2 italic text-sm text-gray-500">
              {Array.from(typingUsers).join(", ")} typing...
            </p>
          )}

          <div className="p-4 bg-white border-t flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 px-4 py-3 rounded-lg border"
              placeholder="Type a message..."
            />
            <button onClick={sendMessage} className="bg-indigo-600 text-white px-6 py-3 rounded-lg">
              <Send size={20} />
            </button>
          </div>
        </div>

        <ParticipantsList users={users} username={username} />
      </div>
    </div>
  );
}
