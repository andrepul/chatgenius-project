import { Hash, ChevronDown, MessageSquare, Circle, User, ChevronRight, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";

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
  const [isNewDMOpen, setIsNewDMOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDMs, setActiveDMs] = useState<Set<string>>(new Set());

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

  const handleStartDM = (userId: string, username: string) => {
    console.log('Starting DM with user:', userId, username);
    setActiveDMs(prev => new Set(prev).add(userId));
    onDMSelect?.(userId);
    setIsNewDMOpen(false);
  };

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

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={() => toggleSection('dms')}
              className="text-left flex items-center text-sm font-semibold text-muted-foreground hover:text-secondary-foreground"
            >
              <span>Direct Messages</span>
              {sectionsState.dms ? <ChevronDown size={18} className="ml-1" /> : <ChevronRight size={18} className="ml-1" />}
            </button>
            <button
              onClick={() => setIsNewDMOpen(true)}
              className="p-1 hover:bg-chat-hover rounded"
              title="New Direct Message"
            >
              <Plus size={18} className="text-muted-foreground hover:text-secondary-foreground" />
            </button>
          </div>
          {sectionsState.dms && (
            <ul className="space-y-1">
              {Array.from(activeDMs).map((userId) => {
                const user = users.find(u => u.id === userId);
                if (!user) return null;
                return (
                  <li key={userId}>
                    <button 
                      className={`w-full text-left flex items-center space-x-2 text-secondary-foreground hover:bg-chat-hover rounded p-2 ${
                        activeChannel === `dm-${userId}` ? 'bg-chat-hover' : ''
                      }`}
                      onClick={() => {
                        console.log('DM clicked:', userId);
                        onChannelSelect(`dm-${userId}`);
                        onDMSelect?.(userId);
                      }}
                    >
                      <div className="relative">
                        <MessageSquare size={18} />
                        <Circle 
                          className={`absolute bottom-0 right-0 w-2 h-2 ${getStatusColor(user.status || 'offline')} fill-current`}
                        />
                      </div>
                      <span>{user.username}</span>
                    </button>
                  </li>
                );
              })}
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

      <Dialog open={isNewDMOpen} onOpenChange={setIsNewDMOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Direct Message</DialogTitle>
          </DialogHeader>
          <Command>
            <CommandInput 
              placeholder="Type a username..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {filteredUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => handleStartDM(user.id, user.username || '')}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <User size={18} />
                        <Circle 
                          className={`absolute bottom-0 right-0 w-2 h-2 ${getStatusColor(user.status || 'offline')} fill-current`}
                        />
                      </div>
                      <span>{user.username}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatSidebar;