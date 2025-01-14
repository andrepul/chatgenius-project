import { Hash, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface ChannelListProps {
  activeChannel: string;
  onChannelSelect: (channelName: string) => void;
}

const ChannelList = ({ activeChannel, onChannelSelect }: ChannelListProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const channels = [
    { id: 1, name: "general" },
    { id: 2, name: "random" },
    { id: 3, name: "introductions" },
  ];

  return (
    <div className="p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-600"
      >
        <div className="flex items-center space-x-2">
          <Hash size={18} />
          <span>Channels</span>
        </div>
        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      
      {isExpanded && (
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
      )}
    </div>
  );
};

export default ChannelList;