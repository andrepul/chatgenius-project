import { useState } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import { Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const [activeChannel, setActiveChannel] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState<"channel" | "global">("channel");
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

  const filteredMessages = messages.filter((message) => {
    const matchesSearch = message.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = searchScope === "global" || message.channel === activeChannel;
    return (!searchQuery || matchesSearch) && matchesChannel;
  });

  return (
    <div className="flex h-screen bg-white">
      <ChatSidebar 
        activeChannel={activeChannel} 
        onChannelSelect={setActiveChannel} 
      />
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className="text-xl font-semibold">#{activeChannel}</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
                {searchScope === "channel" ? "This Channel" : "All Channels"}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSearchScope("channel")}>
                  This Channel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchScope("global")}>
                  All Channels
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredMessages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
        <ChatInput 
          onSendMessage={handleSendMessage} 
          activeChannel={activeChannel}
        />
      </div>
    </div>
  );
};

export default Index;