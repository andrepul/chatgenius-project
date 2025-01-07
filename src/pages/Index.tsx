import { useState } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";

const Index = () => {
  const [activeChannel, setActiveChannel] = useState("general");
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "Welcome to the chat!",
      sender: "System",
      timestamp: new Date(),
      channel: "general"
    },
    {
      id: 2,
      content: "Hey everyone! 👋",
      sender: "Sarah",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      channel: "general"
    },
  ]);

  const handleSendMessage = (content: string) => {
    const newMessage = {
      id: messages.length + 1,
      content,
      sender: "You",
      timestamp: new Date(),
      channel: activeChannel
    };
    setMessages([...messages, newMessage]);
  };

  const filteredMessages = messages.filter(
    (message) => message.channel === activeChannel
  );

  return (
    <div className="flex h-screen bg-white">
      <ChatSidebar 
        activeChannel={activeChannel} 
        onChannelSelect={setActiveChannel} 
      />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {filteredMessages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default Index;