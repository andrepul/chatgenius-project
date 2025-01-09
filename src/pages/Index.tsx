import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ChatSidebar from "@/components/ChatSidebar";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import Auth from "@/components/Auth";
import { Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Message } from "@/types/message";
import { User } from "@supabase/supabase-js";

function Index() {
  const [session, setSession] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState("general");
  const [activeDM, setActiveDM] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState<"channel" | "global">("channel");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Check active session
    console.log('Checking session...');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        setError(error.message);
      } else {
        console.log('Session status:', session ? 'Logged in' : 'No session');
        setSession(session?.user ?? null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event);
      setSession(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading state
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Error: {error}
      </div>
    );
  }

  // If no session, show auth component
  if (!session) {
    console.log('No session, showing Auth component');
    return <Auth />;
  }

  console.log('Rendering main chat interface');
  const handleSendMessage = async (content: string, file?: File) => {
    let attachment;
    if (file) {
      // In a real app, you would upload the file to a storage service
      // and get back a URL. For now, we'll create an object URL
      const url = URL.createObjectURL(file);
      attachment = {
        name: file.name,
        url,
        type: file.type
      };
    }

    const newMessage: Message = {
      id: messages.length + 1,
      content,
      sender: "You",
      senderId: session.id, // Add sender ID
      timestamp: new Date(),
      channel: activeDM ? null : activeChannel,
      isDM: !!activeDM,
      recipientId: activeDM || undefined,
      replyCount: 0,
      reactions: {},
      attachment
    };
    setMessages([...messages, newMessage]);
  };

  const handleChannelSelect = (channelName: string) => {
    setActiveChannel(channelName);
    if (!channelName.startsWith('dm-')) {
      setActiveDM(null);
    }
  };

  const handleDMSelect = (userId: string) => {
    setActiveDM(userId);
  };

  const filteredMessages = messages.filter((message) => {
    const matchesSearch = message.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = searchScope === "global" || 
      (activeDM 
        ? message.isDM && (message.recipientId === activeDM || message.sender === "You")
        : message.channel === activeChannel);
    return (!searchQuery || matchesSearch) && matchesChannel;
  });

  const getDisplayName = () => {
    if (activeDM) {
      const dmUser = {
        user1: "Sarah Smith",
        user2: "John Doe",
        user3: "Alice Johnson"
      }[activeDM];
      return dmUser || "Unknown User";
    }
    return `#${activeChannel}`;
  };

  return (
    <div className="flex h-screen bg-white">
      <ChatSidebar 
        activeChannel={activeChannel} 
        onChannelSelect={handleChannelSelect}
        onDMSelect={handleDMSelect}
      />
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className="text-xl font-semibold">{getDisplayName()}</h1>
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
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              currentUser="You"
            />
          ))}
        </div>

        <ChatInput 
          onSendMessage={handleSendMessage} 
          activeChannel={activeDM ? getDisplayName() : activeChannel}
          placeholder={activeDM ? `Message ${getDisplayName()}` : undefined}
        />
      </div>
    </div>
  );
}

export default Index;
