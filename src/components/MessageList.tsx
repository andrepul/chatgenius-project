import { useEffect, useRef } from "react";
import { Message } from "@/types/message";
import ChatMessage from "./ChatMessage";

interface MessageListProps {
  messages: Message[];
  currentUser: string;
  onThreadClick: (message: Message) => void;
}

const MessageList = ({ messages, currentUser, onThreadClick }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom on initial load and when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col gap-2 p-4">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          currentUser={currentUser}
          onThreadClick={onThreadClick}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;