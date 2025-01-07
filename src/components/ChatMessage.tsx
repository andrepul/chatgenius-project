import { format } from "date-fns";

interface ChatMessageProps {
  message: {
    id: number;
    content: string;
    sender: string;
    timestamp: Date;
  };
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  return (
    <div className="py-2 px-4 hover:bg-chat-hover">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
          {message.sender[0].toUpperCase()}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">{message.sender}</span>
            <span className="text-xs text-muted-foreground">
              {format(message.timestamp, "h:mm a")}
            </span>
          </div>
          <p className="text-secondary-foreground">{message.content}</p>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;