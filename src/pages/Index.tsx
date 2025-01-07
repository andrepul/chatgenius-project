import { useState } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";

const Index = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "Welcome to the chat!",
      sender: "System",
      timestamp: new Date(),
    },
    {
      id: 2,
      content: "Hey everyone! 👋",
      sender: "Sarah",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
  ]);

  const handleSendMessage = (content: string) => {
    const newMessage = {
      id: messages.length + 1,
      content,
      sender: "You",
      timestamp: new Date(),
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <div className="flex h-screen bg-white">
      <ChatSidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default Index;