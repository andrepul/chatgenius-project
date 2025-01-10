import { Message } from "@/types/message";
import ChatMessage from "./ChatMessage";
import { User } from "@supabase/supabase-js";

interface MessageListProps {
  messages: Message[];
  session: User;
  onThreadClick: (message: Message) => void;
}

const MessageList = ({ messages, session, onThreadClick }: MessageListProps) => {
  return (
    <div className="flex-1 overflow-y-auto">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          currentUser={session.id}
          onThreadClick={onThreadClick}
          showThread={true}
        />
      ))}
    </div>
  );
};

export default MessageList;