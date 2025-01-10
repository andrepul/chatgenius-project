import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ChatSidebar from "@/components/ChatSidebar";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import ThreadView from "@/components/ThreadView";
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

  const [activeThread, setActiveThread] = useState<Message | null>(null);

  const handleThreadClick = (message: Message) => {
    console.log('Opening thread for message:', message);
    setActiveThread(message);
  };

  const handleCloseThread = () => {
    console.log('Closing thread');
    setActiveThread(null);
  };

  const handleSendReply = async (content: string, parentId: number, attachment?: File) => {
    console.log('Sending reply:', { content, parentId, attachment });
    if (!session) return;

    let attachmentData;
    if (attachment) {
      const url = URL.createObjectURL(attachment);
      attachmentData = {
        name: attachment.name,
        url,
        type: attachment.type
      };
    }

    const messageData = {
      content,
      sender_id: session.id,
      channel: activeChannel,
      parent_id: parentId,
      reactions: {},
    };

    try {
      // First, insert the reply
      const { data: replyData, error: replyError } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();

      if (replyError) throw replyError;

      // Then, update the parent message's reply count
      const { error: updateError } = await supabase
        .from('messages')
        .update({ reply_count: (activeThread?.replyCount || 0) + 1 })
        .eq('id', parentId);

      if (updateError) throw updateError;

      const newMessage: Message = {
        id: replyData.id,
        content: replyData.content,
        sender: session.id,
        senderId: replyData.sender_id,
        timestamp: new Date(replyData.created_at),
        channel: replyData.channel,
        isDM: false,
        recipientId: null,
        replyCount: 0,
        reactions: {},
        parentId: replyData.parent_id,
        attachment: attachmentData
      };

      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        // Update the parent message's reply count
        const parentIndex = updatedMessages.findIndex(m => m.id === parentId);
        if (parentIndex !== -1) {
          updatedMessages[parentIndex] = {
            ...updatedMessages[parentIndex],
            replyCount: (updatedMessages[parentIndex].replyCount || 0) + 1
          };
        }
        // Add the new reply
        return [...updatedMessages, newMessage];
      });

    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    }
  };

  const handleChannelSelect = (channelName: string) => {
    console.log('Channel selected:', channelName);
    setActiveChannel(channelName);
    if (!channelName.startsWith('dm-')) {
      setActiveDM(null);
    }
  };

  const handleDMSelect = (userId: string) => {
    console.log('DM selected:', userId);
    setActiveDM(userId);
  };

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
      const convertedMessages: Message[] = data?.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender_id,
        senderId: msg.sender_id,
        timestamp: new Date(msg.created_at),
        channel: msg.channel,
        isDM: msg.is_dm,
        recipientId: msg.recipient_id,
        replyCount: msg.reply_count || 0,
        reactions: msg.reactions as Record<string, string[]> || {},
      })) || [];
      setMessages(convertedMessages);
    }
  };

  const handleReaction = async (messageId: number, emoji: string) => {
    console.log('Handling reaction:', { messageId, emoji });
    
    if (!session) {
      console.log('No user session, cannot react');
      return;
    }

    const userId = session.id;
    const message = messages.find(m => m.id === messageId);
    
    if (!message) {
      console.error('Message not found:', messageId);
      return;
    }

    const updatedReactions = { ...message.reactions };
    
    if (updatedReactions[emoji] && updatedReactions[emoji].includes(userId)) {
      updatedReactions[emoji] = updatedReactions[emoji].filter(id => id !== userId);
      if (updatedReactions[emoji].length === 0) {
        delete updatedReactions[emoji];
      }
    } else {
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

  const handleSendMessage = async (content: string, file?: File) => {
    if (!session) return;

    let attachment;
    if (file) {
      const url = URL.createObjectURL(file);
      attachment = {
        name: file.name,
        url,
        type: file.type
      };
    }

    const messageData = {
      content,
      sender_id: session.id,
      channel: activeDM ? null : activeChannel,
      is_dm: !!activeDM,
      recipient_id: activeDM || null,
      reactions: {},
    };

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();

      if (error) throw error;

      const newMessage: Message = {
        id: data.id,
        content: data.content,
        sender: session.id,
        senderId: data.sender_id,
        timestamp: new Date(data.created_at),
        channel: data.channel,
        isDM: data.is_dm,
        recipientId: data.recipient_id,
        replyCount: data.reply_count || 0,
        reactions: data.reactions as Record<string, string[]>,
        attachment
      };

      setMessages([...messages, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const filteredMessages = messages.filter((message) => {
    const matchesSearch = message.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = searchScope === "global" || 
      (activeDM 
        ? message.isDM && (message.recipientId === activeDM || message.senderId === session?.id)
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
              currentUser={session.id}
              onReaction={handleReaction}
              onThreadClick={handleThreadClick}
              showThread={true}
            />
          ))}
        </div>

        <ChatInput 
          onSendMessage={handleSendMessage} 
          activeChannel={activeDM ? getDisplayName() : activeChannel}
          placeholder={activeDM ? `Message ${getDisplayName()}` : undefined}
        />
      </div>

      {activeThread && (
        <ThreadView
          parentMessage={activeThread}
          messages={messages}
          onClose={handleCloseThread}
          onSendReply={handleSendReply}
        />
      )}
    </div>
  );
}

export default Index;
