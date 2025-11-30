// components/ParticipantsList.jsx
import { Users } from "lucide-react";

export default function ParticipantsList({ users, username }) {
  return (
    <div className="w-64 bg-white border-l p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users size={20} />
        <h3 className="font-semibold">Participants</h3>
      </div>

      {users.map((u) => (
        <div key={u.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-black flex items-center justify-center">
            {u.username[0].toUpperCase()}
          </div>
          <span>{u.username}{u.username === username && " (You)"}</span>
        </div>
      ))}
    </div>
  );
}
