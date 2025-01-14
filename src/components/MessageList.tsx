import { Message } from "@/types/message";
import ChatMessage from "./ChatMessage";

interface MessageListProps {
  messages: Message[];
  onThreadClick: (message: Message) => void;
  currentUser?: string;
}

const MessageList = ({ messages, onThreadClick, currentUser }: MessageListProps) => {
  return (
    <div className="flex-1 overflow-y-auto">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          currentUser={currentUser}
          onThreadClick={onThreadClick}
          showThread={true}
        />
      ))}
    </div>
  );
};

export default MessageList;