import { useState } from "react";
import ChatSidebar from "./ChatSidebar";
import MessageList from "./MessageList";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ThreadView from "./ThreadView";
import { Message } from "@/types/message";
import { User } from "@supabase/supabase-js";

interface ChatLayoutProps {
  session: User;
  messages: Message[];
  activeChannel: string;
  activeDM: string | null;
  onSendMessage: (content: string, file?: File) => Promise<void>;
  onChannelSelect: (channelName: string) => void;
  onDMSelect: (userId: string) => void;
}

const ChatLayout = ({
  session,
  messages,
  activeChannel,
  activeDM,
  onSendMessage,
  onChannelSelect,
  onDMSelect,
}: ChatLayoutProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState<"channel" | "global">("channel");
  const [activeThread, setActiveThread] = useState<Message | null>(null);

  const handleThreadClick = (message: Message) => {
    console.log('Opening thread for message:', message);
    setActiveThread(message);
  };

  const handleCloseThread = () => {
    console.log('Closing thread');
    setActiveThread(null);
  };

  const filteredMessages = messages.filter((message) => {
    const matchesSearch = message.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = searchScope === "global" || 
      (activeDM 
        ? message.isDM && (message.recipientId === activeDM || message.senderId === session?.id)
        : message.channel === activeChannel);
    return (!searchQuery || matchesSearch) && matchesChannel;
  });

  const getDisplayName = () => {
    if (activeDM) {
      const dmUser = {
        user1: "Sarah Smith",
        user2: "John Doe",
        user3: "Alice Johnson"
      }[activeDM];
      return dmUser || "Unknown User";
    }
    return `#${activeChannel}`;
  };

  return (
    <div className="flex h-screen bg-white">
      <ChatSidebar 
        activeChannel={activeChannel} 
        onChannelSelect={onChannelSelect}
        onDMSelect={onDMSelect}
      />
      <div className="flex-1 flex flex-col">
        <ChatHeader 
          displayName={getDisplayName()}
          searchQuery={searchQuery}
          searchScope={searchScope}
          onSearchQueryChange={setSearchQuery}
          onSearchScopeChange={setSearchScope}
        />

        <MessageList
          messages={filteredMessages}
          session={session}
          onThreadClick={handleThreadClick}
        />

        <ChatInput 
          onSendMessage={onSendMessage} 
          activeChannel={activeDM ? getDisplayName() : activeChannel}
          placeholder={activeDM ? `Message ${getDisplayName()}` : undefined}
        />
      </div>

      {activeThread && (
        <ThreadView
          parentMessage={activeThread}
          messages={messages}
          onClose={handleCloseThread}
          onSendReply={async (content: string, parentId: number, attachment?: File) => {
            // We'll implement this in the next iteration
            console.log('Sending reply:', { content, parentId, attachment });
          }}
        />
      )}
    </div>
  );
};

export default ChatLayout;