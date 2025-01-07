import { MessageSquare } from "lucide-react";
import { Message } from "@/types/message";
import EmojiPicker from "./EmojiPicker";

interface ChatMessageProps {
  message: Message;
  showThread?: boolean;
  onThreadClick?: (message: Message) => void;
  onReaction?: (messageId: number, emoji: string) => void;
  currentUser?: string;
}

const ChatMessage = ({
  message,
  showThread = true,
  onThreadClick,
  onReaction,
  currentUser = "You",
}: ChatMessageProps) => {
  const reactions = message.reactions || {};
  
  return (
    <div className="py-2 px-4 hover:bg-chat-hover">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
          {message.sender[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{message.sender}</span>
            <span className="text-xs text-muted-foreground">
              {new Intl.DateTimeFormat([], {
                hour: "numeric",
                minute: "numeric",
              }).format(message.timestamp)}
            </span>
          </div>
          <p className="text-secondary-foreground">{message.content}</p>

          {/* Show any reactions (if implemented) */}
          {Object.entries(reactions).map(([emoji, users]) => (
            <div key={emoji} className="text-xs inline-block mr-2">
              {emoji} {users.length}
            </div>
          ))}

          {/* Button to open the thread */}
          {showThread && (
            <button
              onClick={() => onThreadClick?.(message)}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
            >
              <MessageSquare size={14} />
              {message.replyCount === 0
                ? "Start thread"
                : `${message.replyCount} ${message.replyCount === 1 ? "reply" : "replies"}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;