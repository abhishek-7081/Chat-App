// components/HomeScreen.jsx
import { Copy, Check } from "lucide-react";

export default function HomeScreen({
  username,
  setUsername,
  roomId,
  setRoomId,
  createRoom,
  copyLink,
  copied,
  joinRoom,
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-4xl font-bold text-indigo-600 text-center mb-2">
          QuickChat
        </h1>

        <div className="space-y-6 mt-6">
          <input
            type="text"
            placeholder="Your Name"
            className="w-full px-4 py-3 rounded-lg border"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Room Code"
              className="flex-1 px-4 py-3 rounded-lg border uppercase"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            />
            <button onClick={createRoom} className="px-4 py-3 bg-gray-200 rounded-lg">
              Create
            </button>
          </div>

          {roomId && (
            <button
              onClick={copyLink}
              className="w-full flex items-center gap-2 justify-center bg-gray-100 py-2 rounded-lg"
            >
              {copied ? <Check className="text-green-600" size={16} /> : <Copy size={16} />}
              {copied ? "Link Copied!" : "Copy Link"}
            </button>
          )}

          <button
            onClick={joinRoom}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}
