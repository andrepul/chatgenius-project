import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ChatSidebar from "@/components/ChatSidebar";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import Auth from "@/components/Auth";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();

  useEffect(() => {
    console.log('Checking session...');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        setError(error.message);
      } else {
        console.log('Session status:', session ? 'Logged in' : 'No session');
        setSession(session?.user ?? null);
        if (session?.user) {
          fetchMessages();
        }
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event);
      setSession(session?.user ?? null);
      if (session?.user) {
        fetchMessages();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } else {
      console.log('Fetched messages:', data);
      setMessages(data || []);
    }
  };

  const handleReaction = async (messageId: number, emoji: string) => {
    console.log('Handling reaction:', { messageId, emoji });
    
    if (!session?.user) {
      console.log('No user session, cannot react');
      return;
    }

    const userId = session.user.id;
    const message = messages.find(m => m.id === messageId);
    
    if (!message) {
      console.error('Message not found:', messageId);
      return;
    }

    // Create a copy of the current reactions
    const updatedReactions = { ...message.reactions };
    
    // If the emoji reaction exists and user has already reacted, remove their reaction
    if (updatedReactions[emoji] && updatedReactions[emoji].includes(userId)) {
      updatedReactions[emoji] = updatedReactions[emoji].filter(id => id !== userId);
      // Remove the emoji key if no users are reacting with it
      if (updatedReactions[emoji].length === 0) {
        delete updatedReactions[emoji];
      }
    } else {
      // Add the user's reaction
      if (!updatedReactions[emoji]) {
        updatedReactions[emoji] = [];
      }
      updatedReactions[emoji] = [...updatedReactions[emoji], userId];
    }

    try {
      const { error } = await supabase
        .from('messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(messages.map(m => 
        m.id === messageId 
          ? { ...m, reactions: updatedReactions }
          : m
      ));

      console.log('Reaction updated successfully');
    } catch (error) {
      console.error('Error updating reaction:', error);
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!session) {
    console.log('No session, showing Auth component');
    return <Auth />;
  }

  console.log('Rendering main chat interface');
  const handleSendMessage = async (content: string, file?: File) => {
    let attachment;
    if (file) {
      const url = URL.createObjectURL(file);
      attachment = {
        name: file.name,
        url,
        type: file.type
      };
    }

    const newMessage = {
      content,
      sender: session.user?.email || "Anonymous",
      sender_id: session.user?.id,
      channel: activeDM ? null : activeChannel,
      is_dm: !!activeDM,
      recipient_id: activeDM || undefined,
      reactions: {},
      attachment
    };

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([newMessage])
        .select()
        .single();

      if (error) throw error;

      setMessages([...messages, data]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
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
        ? message.is_dm && (message.recipient_id === activeDM || message.sender_id === session.user?.id)
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
          {filteredMessages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              currentUser={session.user?.id}
              onReaction={handleReaction}
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