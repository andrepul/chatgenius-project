import { useState, useEffect } from "react";
import ChatSidebar from "./ChatSidebar";
import MessageList from "./MessageList";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ThreadView from "./ThreadView";
import { Message } from "@/types/message";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import FilesView from "./FilesView";

interface ChatLayoutProps {
  session: User;
  messages: Message[];
  activeChannel: string;
  activeDM?: string | null;
  onSendMessage: (content: string, file?: File) => Promise<{ data: any; error: any | null; }>;
  onChannelSelect: (channelName: string) => void;
  onDMSelect?: (userId: string) => void;
  onFilesClick: () => void;
  showFiles: boolean;
}

interface DMUser {
  id: string;
  username: string;
}

const ChatLayout = ({
  session,
  messages,
  activeChannel,
  activeDM,
  onSendMessage,
  onChannelSelect,
  onDMSelect,
  onFilesClick,
  showFiles,
}: ChatLayoutProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState<"channel" | "global">("channel");
  const [activeThread, setActiveThread] = useState<Message | null>(null);
  const [showThread, setShowThread] = useState(false);
  const [dmUsers, setDmUsers] = useState<Record<string, DMUser>>({});
  const { toast } = useToast();

  // Fetch DM user information
  useEffect(() => {
    const fetchDMUsers = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, username');
        
        if (error) throw error;

        const usersMap: Record<string, DMUser> = {};
        profiles?.forEach(profile => {
          usersMap[profile.id] = {
            id: profile.id,
            username: profile.username || 'Unknown User'
          };
        });
        
        setDmUsers(usersMap);
      } catch (error) {
        console.error('Error fetching DM users:', error);
      }
    };

    fetchDMUsers();
  }, []);

  const handleThreadClick = (message: Message) => {
    console.log('Opening thread for message:', message);
    setActiveThread(message);
    setShowThread(true);
  };

  const handleCloseThread = () => {
    console.log('Closing thread');
    setActiveThread(null);
    setShowThread(false);
  };

  const handleSendReply = async (content: string, parentId: number, attachment?: File) => {
    console.log('Sending reply:', { content, parentId, attachment });
    
    const currentChannel = activeDM ? `dm-${[session.id, activeDM].sort().join('-')}` : activeChannel;
    console.log('Current channel for reply:', currentChannel);
    
    const messageData = {
      content,
      sender_id: session.id,
      channel: currentChannel,
      is_dm: !!activeDM,
      recipient_id: activeDM || null,
      parent_id: parentId,
      reactions: {},
    };

    try {
      console.log('Inserting reply with data:', messageData);
      const { data: newMessage, error: insertError } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('Reply inserted successfully:', newMessage);

      const { error: updateError } = await supabase
        .from('messages')
        .update({ reply_count: messages.find(m => m.id === parentId)?.replyCount! + 1 })
        .eq('id', parentId);

      if (updateError) throw updateError;

      const response = await onSendMessage(content, attachment);
      if (response.error) {
        throw response.error;
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (content: string, file?: File) => {
    if (!session) return;
    console.log('Handling send message with file:', file?.name);
    
    try {
      const response = await onSendMessage(content, file);
      if (response.error) {
        throw response.error;
      }
      
      // If message was sent successfully and has an ID, generate embedding
      if (response.data?.id) {
        console.log('Generating embedding for message:', response.data.id);
        const { error: embeddingError } = await supabase.functions.invoke('generate-embedding', {
          body: { 
            messageId: response.data.id,
            content: content
          }
        });
        
        if (embeddingError) {
          console.error('Error generating embedding:', embeddingError);
        }
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
    }
  };

  const filteredMessages = messages.filter((message) => {
    const matchesSearch = message.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeDM) {
      const dmChannelName = `dm-${[session.id, activeDM].sort().join('-')}`;
      return (!searchQuery || matchesSearch) && message.channel === dmChannelName;
    }
    
    return (!searchQuery || matchesSearch) && message.channel === activeChannel && !message.isDM;
  });

  const getDisplayName = () => {
    if (activeDM) {
      const dmUser = dmUsers[activeDM];
      return dmUser ? dmUser.username : "Unknown User";
    }
    return `#${activeChannel}`;
  };

  return (
    <div className="flex h-screen">
      <ChatSidebar
        activeChannel={activeChannel}
        onChannelSelect={onChannelSelect}
        onDMSelect={onDMSelect}
        currentUser={session.id}
        onFilesClick={onFilesClick}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {showFiles ? (
          <FilesView currentUser={session.id} />
        ) : (
          <>
            <ChatHeader
              displayName={getDisplayName()}
              searchQuery={searchQuery}
              searchScope={searchScope}
              onSearchQueryChange={setSearchQuery}
              onSearchScopeChange={setSearchScope}
            />
            <MessageList
              messages={filteredMessages}
              currentUser={session.id}
              onThreadClick={handleThreadClick}
            />
            <ChatInput 
              onSendMessage={handleSendMessage}
              activeChannel={activeChannel}
              placeholder={`Message ${getDisplayName()}`}
            />
          </>
        )}
      </div>
      {showThread && activeThread && (
        <ThreadView
          parentMessage={activeThread}
          messages={messages}
          onClose={handleCloseThread}
          onSendReply={handleSendReply}
        />
      )}
    </div>
  );
};

export default ChatLayout;