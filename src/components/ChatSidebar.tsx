import { Hash, ChevronDown, MessageSquare, Circle } from "lucide-react";

interface ChatSidebarProps {
  activeChannel: string;
  onChannelSelect: (channelName: string) => void;
  onDMSelect?: (userId: string) => void;
}

const ChatSidebar = ({ activeChannel, onChannelSelect, onDMSelect }: ChatSidebarProps) => {
  const channels = [
    { id: 1, name: "general" },
    { id: 2, name: "random" },
    { id: 3, name: "introductions" },
  ];

  const dms = [
    { id: "user1", name: "Sarah Smith", status: "online" },
    { id: "user2", name: "John Doe", status: "away" },
    { id: "user3", name: "Alice Johnson", status: "offline" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-500";
      case "away":
        return "text-yellow-500";
      case "offline":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="w-64 bg-secondary h-screen flex flex-col">
      <div className="p-4 border-b">
        <button className="w-full text-left font-semibold flex items-center justify-between text-secondary-foreground hover:bg-chat-hover rounded p-2">
          <span>ChatGenius Community</span>
          <ChevronDown size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Channels</h2>
          <ul className="space-y-1">
            {channels.map((channel) => (
              <li key={channel.id}>
                <button 
                  className={`w-full text-left flex items-center space-x-2 text-secondary-foreground hover:bg-chat-hover rounded p-2 ${
                    activeChannel === channel.name ? 'bg-chat-hover' : ''
                  }`}
                  onClick={() => onChannelSelect(channel.name)}
                >
                  <Hash size={18} />
                  <span>{channel.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Direct Messages</h2>
          <ul className="space-y-1">
            {dms.map((user) => (
              <li key={user.id}>
                <button 
                  className={`w-full text-left flex items-center space-x-2 text-secondary-foreground hover:bg-chat-hover rounded p-2 ${
                    activeChannel === `dm-${user.id}` ? 'bg-chat-hover' : ''
                  }`}
                  onClick={() => {
                    onChannelSelect(`dm-${user.id}`);
                    onDMSelect?.(user.id);
                  }}
                >
                  <div className="relative">
                    <MessageSquare size={18} />
                    <Circle 
                      className={`absolute bottom-0 right-0 w-2 h-2 ${getStatusColor(user.status)} fill-current`}
                    />
                  </div>
                  <span>{user.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;