import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import SidebarHeader from "./sidebar/SidebarHeader";
import ChannelList from "./sidebar/ChannelList";
import DirectMessages from "./sidebar/DirectMessages";
import UserList from "./sidebar/UserList";
import FileList from "./sidebar/FileList";

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
  const [users, setUsers] = useState<Profile[]>([]);
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

  return (
    <div className="w-64 bg-gray-50 border-r flex flex-col h-screen">
      <SidebarHeader />
      <div className="flex-1 overflow-y-auto">
        <ChannelList 
          activeChannel={activeChannel} 
          onChannelSelect={onChannelSelect} 
        />
        <DirectMessages 
          activeChannel={activeChannel}
          onChannelSelect={onChannelSelect}
          onDMSelect={onDMSelect}
          users={users}
          activeDMs={activeDMs}
        />
        <UserList users={users} />
        <FileList 
          files={files}
          currentUser={currentUser}
          onFilesClick={onFilesClick}
          onDeleteFile={handleDeleteFile}
        />
      </div>
    </div>
  );
};

export default ChatSidebar;