import { Hash, ChevronDown, MessageSquare, Circle, User, ChevronRight, Plus, Download, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

interface ChatSidebarProps {
  activeChannel: string;
  onChannelSelect: (channelName: string) => void;
  onDMSelect?: (userId: string) => void;
  currentUser?: string;
  onFilesClick: () => void;
}

interface Profile {
  id: string;
  username: string;
  status?: string;
}

interface FileData {
  id: string;
  name: string;
  storage_path: string;
  type: string;
  size: number;
  uploaded_by: string;
  created_at: string;
}

const ChatSidebar = ({ activeChannel, onChannelSelect, onDMSelect, currentUser, onFilesClick }: ChatSidebarProps) => {
  const [sectionsState, setSectionsState] = useState({
    channels: true,
    dms: true,
    users: true,
    files: true
  });
  const [users, setUsers] = useState<Profile[]>([]);
  const [isNewDMOpen, setIsNewDMOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDMs, setActiveDMs] = useState<Set<string>>(new Set());
  const [files, setFiles] = useState<FileData[]>([]);
  const { toast } = useToast();

  const fetchFiles = async () => {
    try {
      const { data: filesData, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(filesData || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (fileId: string, storagePath: string) => {
    try {
      const { error } = await supabase
        .from('files')
        .delete()
        .match({ id: fileId });

      if (error) throw error;

      setFiles(files.filter(file => file.id !== fileId));
      toast({
        title: "File deleted",
        description: "The file has been successfully deleted",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFiles();
    
    // Set up real-time subscription
    const filesSubscription = supabase
      .channel('files')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'files' }, () => {
        fetchFiles();
      })
      .subscribe();

    return () => {
      filesSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchUsersAndDMs = async () => {
      try {
        console.log('Fetching users from profiles table...');
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, status');
        
        if (profilesError) {
          console.error('Error fetching users:', profilesError);
          return;
        }

        console.log('Fetched users:', profilesData);
        setUsers(profilesData || []);

        // Get current user's ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('Fetching active DMs for user:', user.id);
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('sender_id, recipient_id')
          .eq('is_dm', true)
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);

        if (messagesError) {
          console.error('Error fetching DMs:', messagesError);
          return;
        }

        console.log('Fetched DM messages:', messagesData);
        const uniqueDMUsers = new Set<string>();
        messagesData?.forEach(msg => {
          if (msg.sender_id === user.id) {
            uniqueDMUsers.add(msg.recipient_id);
          } else {
            uniqueDMUsers.add(msg.sender_id);
          }
        });

        console.log('Setting active DMs:', uniqueDMUsers);
        setActiveDMs(uniqueDMUsers);
      } catch (error) {
        console.error('Error in fetchUsersAndDMs:', error);
      }
    };

    fetchUsersAndDMs();

    // Subscribe to realtime status updates
    const statusSubscription = supabase
      .channel('profiles')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles' 
        }, 
        (payload: any) => {
          console.log('Profile status updated:', payload);
          setUsers(prevUsers => 
            prevUsers.map(user => 
              user.id === payload.new.id 
                ? { ...user, status: payload.new.status }
                : user
            )
          );
        }
      )
      .subscribe();

    return () => {
      statusSubscription.unsubscribe();
    };
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

  const handleStartDM = async (userId: string, username: string) => {
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
    <div className="w-64 bg-gray-50 border-r">
      <div className="p-4 border-b">
        <button className="w-full text-left font-semibold flex items-center justify-between text-secondary-foreground hover:bg-chat-hover rounded p-2">
          <span>ChatGenius Community</span>
          <ChevronDown size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <button
            onClick={() => setSectionsState(prev => ({ ...prev, channels: !prev.channels }))}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-600"
          >
            <div className="flex items-center space-x-2">
              <Hash size={18} />
              <span>Channels</span>
            </div>
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

        <div className="mt-4">
          <button
            onClick={() => {
              setSectionsState(prev => ({ ...prev, files: !prev.files }));
              if (!sectionsState.files) {
                onFilesClick();
              }
            }}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-600"
          >
            <div className="flex items-center space-x-2">
              <Download size={18} />
              <span>Files</span>
            </div>
            {sectionsState.files ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>

          {sectionsState.files && (
            <div className="mt-1 space-y-1">
              {files.length === 0 ? (
                <p className="px-4 py-2 text-sm text-gray-500">No files shared yet</p>
              ) : (
                files.map((file) => (
                  <div key={file.id} className="group relative">
                    <div className="flex items-center justify-between px-4 py-1 text-sm text-gray-600 hover:bg-gray-100">
                      <button
                        onClick={async () => {
                          try {
                            const { data: { signedUrl }, error } = await supabase
                              .storage
                              .from('files')
                              .createSignedUrl(file.storage_path, 3600);

                            if (error) throw error;
                            window.open(signedUrl, '_blank');
                          } catch (error) {
                            console.error('Error accessing file:', error);
                            toast({
                              title: "Error",
                              description: "Failed to access file",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="flex-1 truncate hover:text-blue-600"
                      >
                        {file.name}
                      </button>
                      {file.uploaded_by === currentUser && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this file?')) {
                              handleDeleteFile(file.id, file.storage_path);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity"
                          title="Delete file"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
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
