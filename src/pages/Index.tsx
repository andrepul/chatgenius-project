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
import ThreadView from "@/components/ThreadView";
import { Message } from "@/types/message";

function Index() {
  const [activeChannel, setActiveChannel] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState<"channel" | "global">("channel");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Welcome to the chat!",
      sender: "System",
      timestamp: new Date(),
      channel: "general",
      replyCount: 0,
      reactions: {}
    },
    {
      id: 2,
      content: "Hey everyone! 👋",
      sender: "Sarah",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      channel: "general",
      replyCount: 0,
      reactions: {}
    },
  ]);
  const [activeThread, setActiveThread] = useState<Message | undefined>();

  const handleSendMessage = (content: string, parentId?: number) => {
    const newMessage: Message = {
      id: messages.length + 1,
      content,
      sender: "You",
      timestamp: new Date(),
      channel: activeChannel,
      parentId,
      replyCount: 0,
      reactions: {}
    };

    if (parentId) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === parentId ? { ...msg, replyCount: (msg.replyCount || 0) + 1 } : msg
        )
      );
    }

    setMessages((prev) => [...prev, newMessage]);
  };

  const handleThreadClick = (message: Message) => {
    setActiveThread(message);
  };

  const handleReaction = (messageId: number, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const currentReactions = msg.reactions || {};
          const currentUsers = currentReactions[emoji] || [];
          const currentUser = "You";

          return {
            ...msg,
            reactions: {
              ...currentReactions,
              [emoji]: currentUsers.includes(currentUser)
                ? currentUsers.filter((u) => u !== currentUser)
                : [...currentUsers, currentUser],
            },
          };
        }
        return msg;
      })
    );
  };

  const filteredMessages = messages.filter((message) => {
    const matchesSearch = message.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = searchScope === "global" || message.channel === activeChannel;
    return (!searchQuery || matchesSearch) && matchesChannel;
  });

  return (
    <div className="flex h-screen bg-white">
      <ChatSidebar activeChannel={activeChannel} onChannelSelect={setActiveChannel} />
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <label className="relative">
              <Search size={16} className="absolute top-2 left-2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages"
                className="pl-8 pr-24 py-2 text-sm border rounded-md"
              />
            </label>
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
            <ChatMessage
              key={message.id}
              message={message}
              onThreadClick={handleThreadClick}
              onReaction={handleReaction}
              currentUser="You"
            />
          ))}
        </div>

        <ChatInput onSendMessage={handleSendMessage} activeChannel={activeChannel} />
      </div>

      <ThreadView
        parentMessage={activeThread}
        messages={messages}
        onClose={() => setActiveThread(undefined)}
        onSendReply={(content, parentId) => handleSendMessage(content, parentId)}
      />
    </div>
  );
}

export default Index;