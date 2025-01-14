import { useState } from "react";
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
  onSendMessage: (content: string, file?: File) => void;
  onChannelSelect: (channelName: string) => void;
  onDMSelect?: (userId: string) => void;
  onFilesClick: () => void;
  showFiles: boolean;
}

interface DMUser {
  id: string;
  name: string;
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
  const { toast } = useToast();

  const dmUsers: Record<string, DMUser> = {
    "d7bed21c-5a38-4c44-87f5-7776d0ca3c33": { id: "d7bed21c-5a38-4c44-87f5-7776d0ca3c33", name: "Sarah Smith" },
    "e9b74d3d-87a4-4c43-8f3e-64c2d6d65bd0": { id: "e9b74d3d-87a4-4c43-8f3e-64c2d6d65bd0", name: "John Doe" },
    "f6d8a35b-2e9c-4c47-8f1a-25d2d6d65bd0": { id: "f6d8a35b-2e9c-4c47-8f1a-25d2d6d65bd0", name: "Alice Johnson" }
  };

  const handleThreadClick = (message: Message) => {
    console.log('Opening thread for message:', message);
    setActiveThread(message);
  };

  const handleCloseThread = () => {
    console.log('Closing thread');
    setActiveThread(null);
  };

  const handleSendReply = async (content: string, parentId: number, attachment?: File) => {
    console.log('Sending reply:', { content, parentId, attachment });
    
    const currentChannel = activeDM ? `dm-${activeDM}` : activeChannel;
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

      onSendMessage(content, attachment);
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
    onSendMessage(content, file);
  };

  const filteredMessages = messages.filter((message) => {
    const matchesSearch = message.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = searchScope === "global" || 
      (activeDM 
        ? message.isDM && message.channel === `dm-${activeDM}`
        : message.channel === activeChannel);
    return (!searchQuery || matchesSearch) && matchesChannel;
  });

  const getDisplayName = () => {
    if (activeDM) {
      const dmUser = dmUsers[activeDM];
      return dmUser ? dmUser.name : "Unknown User";
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