import { Hash, ChevronDown, MessageSquare, Circle, User, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ChatSidebarProps {
  activeChannel: string;
  onChannelSelect: (channelName: string) => void;
  onDMSelect?: (userId: string) => void;
}

interface Profile {
  id: string;
  username: string;
  status?: string;
}

const ChatSidebar = ({ activeChannel, onChannelSelect, onDMSelect }: ChatSidebarProps) => {
  const [sectionsState, setSectionsState] = useState({
    channels: true,
    dms: true,
    users: true
  });
  const [users, setUsers] = useState<Profile[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('Fetching users from profiles table...');
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, status');
        
        if (error) {
          console.error('Error fetching users:', error);
          return;
        }

        console.log('Fetched users:', data);
        setUsers(data || []);
      } catch (error) {
        console.error('Error in fetchUsers:', error);
      }
    };

    fetchUsers();
  }, []);

  const toggleSection = (section: keyof typeof sectionsState) => {
    setSectionsState(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const channels = [
    { id: 1, name: "general" },
    { id: 2, name: "random" },
    { id: 3, name: "introductions" },
  ];

  const dms = [
    { 
      id: "d7bed21c-5a38-4c44-87f5-7776d0ca3c33", 
      name: "Sarah Smith", 
      status: "online" 
    },
    { 
      id: "e9b74d3d-87a4-4c43-8f3e-64c2d6d65bd0", 
      name: "John Doe", 
      status: "away" 
    },
    { 
      id: "f6d8a35b-2e9c-4c47-8f1a-25d2d6d65bd0", 
      name: "Alice Johnson", 
      status: "offline" 
    },
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
          <button 
            onClick={() => toggleSection('channels')}
            className="w-full text-left flex items-center justify-between text-sm font-semibold text-muted-foreground mb-2 hover:text-secondary-foreground"
          >
            <span>Channels</span>
            {sectionsState.channels ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          {sectionsState.channels && (
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

        <div className="p-4">
          <button 
            onClick={() => toggleSection('dms')}
            className="w-full text-left flex items-center justify-between text-sm font-semibold text-muted-foreground mb-2 hover:text-secondary-foreground"
          >
            <span>Direct Messages</span>
            {sectionsState.dms ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          {sectionsState.dms && (
            <ul className="space-y-1">
              {dms.map((user) => (
                <li key={user.id}>
                  <button 
                    className={`w-full text-left flex items-center space-x-2 text-secondary-foreground hover:bg-chat-hover rounded p-2 ${
                      activeChannel === `dm-${user.id}` ? 'bg-chat-hover' : ''
                    }`}
                    onClick={() => {
                      console.log('DM clicked:', user.id);
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
          )}
        </div>

        <div className="p-4">
          <button 
            onClick={() => toggleSection('users')}
            className="w-full text-left flex items-center justify-between text-sm font-semibold text-muted-foreground mb-2 hover:text-secondary-foreground"
          >
            <span>Users</span>
            {sectionsState.users ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          {sectionsState.users && (
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
      </div>
    </div>
  );
};

export default ChatSidebar;