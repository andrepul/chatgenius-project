import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Auth from "@/components/Auth";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@/types/message";
import { User } from "@supabase/supabase-js";
import ChatLayout from "@/components/ChatLayout";

function Index() {
  const [session, setSession] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState("general");
  const [activeDM, setActiveDM] = useState<string | null>(null);
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

    // Subscribe to realtime messages
    const messagesSubscription = supabase
      .channel('messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        console.log('Messages changed, fetching updates...');
        fetchMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      messagesSubscription.unsubscribe();
    };
  }, []);

  const fetchMessages = async () => {
    console.log('Fetching messages...');
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

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
        parentId: msg.parent_id,
      })) || [];

      setMessages(convertedMessages);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

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
        attachment,
        parentId: data.parent_id
      };

      setMessages(prev => [...prev, newMessage]);
      
      // Messages will be automatically refreshed via the subscription
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

  return (
    <ChatLayout
      session={session}
      messages={messages}
      activeChannel={activeChannel}
      activeDM={activeDM}
      onSendMessage={handleSendMessage}
      onChannelSelect={handleChannelSelect}
      onDMSelect={handleDMSelect}
    />
  );
}

export default Index;