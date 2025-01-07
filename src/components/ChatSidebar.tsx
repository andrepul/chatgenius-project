import { Hash, ChevronDown } from "lucide-react";

const ChatSidebar = () => {
  const channels = [
    { id: 1, name: "general" },
    { id: 2, name: "random" },
    { id: 3, name: "introductions" },
  ];

  return (
    <div className="w-64 bg-secondary h-screen flex flex-col">
      <div className="p-4 border-b">
        <button className="w-full text-left font-semibold flex items-center justify-between text-secondary-foreground hover:bg-chat-hover rounded p-2">
          <span>Workspace Name</span>
          <ChevronDown size={18} />
        </button>
      </div>
      
      <div className="p-4">
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">Channels</h2>
        <ul className="space-y-1">
          {channels.map((channel) => (
            <li key={channel.id}>
              <button className="w-full text-left flex items-center space-x-2 text-secondary-foreground hover:bg-chat-hover rounded p-2">
                <Hash size={18} />
                <span>{channel.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ChatSidebar;