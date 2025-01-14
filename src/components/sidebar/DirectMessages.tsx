import { MessageSquare, Circle, Plus, ChevronDown, ChevronRight, User } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";

interface Profile {
  id: string;
  username: string;
  status?: string;
}

interface DirectMessagesProps {
  activeChannel: string;
  onChannelSelect: (channelName: string) => void;
  onDMSelect?: (userId: string) => void;
  users: Profile[];
  activeDMs: Set<string>;
}

const DirectMessages = ({ activeChannel, onChannelSelect, onDMSelect, users, activeDMs }: DirectMessagesProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isNewDMOpen, setIsNewDMOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "text-green-500";
      case "away": return "text-yellow-500";
      case "offline": return "text-gray-400";
      default: return "text-gray-400";
    }
  };

  const handleStartDM = async (userId: string, username: string) => {
    console.log('Starting DM with user:', userId, username);
    onDMSelect?.(userId);
    setIsNewDMOpen(false);
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-left flex items-center text-sm font-semibold text-muted-foreground hover:text-secondary-foreground"
        >
          <span>Direct Messages</span>
          {isExpanded ? <ChevronDown size={18} className="ml-1" /> : <ChevronRight size={18} className="ml-1" />}
        </button>
        <button
          onClick={() => setIsNewDMOpen(true)}
          className="p-1 hover:bg-chat-hover rounded"
          title="New Direct Message"
        >
          <Plus size={18} className="text-muted-foreground hover:text-secondary-foreground" />
        </button>
      </div>

      {isExpanded && (
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

export default DirectMessages;