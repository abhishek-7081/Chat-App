// components/MessageList.jsx
export default function MessageList({ messages, username, messagesEndRef }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.username === username ? "justify-end" : "justify-start"
            }`}
        >
          <div
            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${msg.username === username
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-800"
              }`}
          >
            <p className="text-xs font-semibold opacity-75">{msg.username}</p>
            <p>{msg.text}</p>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
