import { MessageSquare, Circle, Download } from "lucide-react";
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
  
  const getStatusColor = (status?: string) => {
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

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return null; // We'll show the actual image
    }
    return <Download className="w-4 h-4" />;
  };
  
  return (
    <div className="py-2 px-4 hover:bg-chat-hover">
      <div className="flex items-start space-x-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
            {message.sender[0].toUpperCase()}
          </div>
          <Circle 
            className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(message.status)} fill-current`}
          />
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

          {message.attachment && (
            <div className="mt-2">
              {message.attachment.type.startsWith("image/") ? (
                <img
                  src={message.attachment.url}
                  alt={message.attachment.name}
                  className="max-w-sm rounded-lg border"
                />
              ) : (
                <a
                  href={message.attachment.url}
                  download={message.attachment.name}
                  className="inline-flex items-center space-x-2 px-3 py-2 bg-accent rounded-lg text-sm hover:bg-accent/80"
                >
                  <Download className="w-4 h-4" />
                  <span>{message.attachment.name}</span>
                </a>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-1">
            {Object.entries(reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReaction?.(message.id, emoji)}
                className={`inline-flex items-center space-x-1 text-xs rounded-full px-2 py-1 ${
                  users.includes(currentUser)
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <span>{emoji}</span>
                <span>{users.length}</span>
              </button>
            ))}
            <EmojiPicker onEmojiSelect={(emoji) => onReaction?.(message.id, emoji)} />
            
            {showThread && (
              <button
                onClick={() => onThreadClick?.(message)}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <MessageSquare size={14} />
                {message.replyCount === 0
                  ? "Reply"
                  : `${message.replyCount} ${message.replyCount === 1 ? "reply" : "replies"}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;