import { User, Circle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Profile {
  id: string;
  username: string;
  status?: string;
}

interface UserListProps {
  users: Profile[];
}

const UserList = ({ users }: UserListProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "text-green-500";
      case "away": return "text-yellow-500";
      case "offline": return "text-gray-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="p-4">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left flex items-center justify-between text-sm font-semibold text-muted-foreground mb-2 hover:text-secondary-foreground"
      >
        <span>Users</span>
        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      {isExpanded && (
        <ul className="space-y-1">
          {users.map((user) => (
            <li key={user.id}>
              <button 
                className="w-full text-left flex items-center space-x-2 text-secondary-foreground hover:bg-chat-hover rounded p-2"
              >
                <div className="relative">
                  <User size={18} />
                  <Circle 
                    className={`absolute bottom-0 right-0 w-2 h-2 ${getStatusColor(user.status || 'offline')} fill-current`}
                  />
                </div>
                <span>{user.username}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserList;