import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Auth from "@/components/Auth";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@/types/message";
import { User } from "@supabase/supabase-js";
import ChatLayout from "@/components/ChatLayout";

export function getDMChannelName(userId1: string, userId2: string) {
  return `dm-${[userId1, userId2].sort().join('-')}`;
}

function Index() {
  const [session, setSession] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState("general");
  const [activeDM, setActiveDM] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showFiles, setShowFiles] = useState(false);
  const [debugCounter, setDebugCounter] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: authSession }, error }) => {
      if (error) {
        console.error("Session error:", error);
        setError(error.message);
      } else {
        setSession(authSession?.user ?? null);
        if (authSession?.user) {
          console.log("Initial fetch for general channel with user:", authSession.user.id);
          fetchMessages("general", authSession.user.id);
        }
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.id) return;

    console.log("Setting up real-time subscription for channel:", activeChannel);
    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `channel=eq.${activeChannel}`,
        },
        (payload) => {
          console.log("Real-time update received:", payload);
          if (payload.eventType === "INSERT") {
            const newMessage = payload.new;
            setMessages((prev) => [...prev, {
              id: newMessage.id,
              content: newMessage.content,
              sender: newMessage.sender_id,
              senderId: newMessage.sender_id,
              timestamp: new Date(newMessage.created_at),
              channel: newMessage.channel,
              isDM: newMessage.is_dm,
              recipientId: newMessage.recipient_id,
              replyCount: newMessage.reply_count || 0,
              reactions: newMessage.reactions || {},
              parentId: newMessage.parent_id,
            }]);
          }
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up real-time subscription");
      channel.unsubscribe();
    };
  }, [session?.id, activeChannel]);

  const fetchMessages = async (channelName?: string, sessionId?: string) => {
    try {
      const userId = sessionId || session?.id;
      if (!userId) {
        console.log("No session ID available, skipping fetch");
        return;
      }

      console.log("Fetching messages for channel:", channelName || activeChannel, "with user:", userId);
      
      let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (channelName) {
        query = query.eq("channel", channelName);
      } else if (activeDM) {
        query = query.eq("channel", getDMChannelName(userId, activeDM));
      } else {
        query = query.eq("channel", activeChannel);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }

      console.log("Fetched messages:", data?.length || 0);
      
      const convertedMessages: Message[] = (data ?? []).map((msg) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender_id,
        senderId: msg.sender_id,
        timestamp: new Date(msg.created_at),
        channel: msg.channel,
        isDM: msg.is_dm,
        recipientId: msg.recipient_id,
        replyCount: msg.reply_count || 0,
        reactions: (msg.reactions as Record<string, string[]>) || {},
        parentId: msg.parent_id,
      }));

      console.log("Setting messages:", convertedMessages.length);
      setMessages(convertedMessages);
    } catch (error) {
      console.error("Error in fetchMessages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (content: string, file?: File) => {
    if (!session) return;
    try {
      const currentChannel = activeDM
        ? getDMChannelName(session.id, activeDM)
        : activeChannel;

      console.log("Sending message with data:", {
        content,
        sender_id: session.id,
        channel: currentChannel,
        is_dm: !!activeDM,
        recipient_id: activeDM || null,
        reactions: {},
      });

      // First, save the user's message
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert([
          {
            content,
            sender_id: session.id,
            channel: currentChannel,
            is_dm: !!activeDM,
            recipient_id: activeDM || null,
            reactions: {},
          },
        ])
        .select()
        .single();

      if (messageError) throw messageError;

      console.log("Message sent successfully:", messageData);

      // Generate embedding for the message
      if (messageData?.id) {
        console.log('Generating embedding for message:', messageData.id);
        const { error: embeddingError } = await supabase.functions.invoke('generate-embedding', {
          body: { 
            messageId: messageData.id,
            content: content
          }
        });
        
        if (embeddingError) {
          console.error('Error generating embedding:', embeddingError);
        }
      }

      // If this is the ask-ai channel, call the AI function
      if (currentChannel === 'ask-ai') {
        try {
          const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-chat', {
            body: { 
              message: content,
              senderId: session.id  // Pass the sender's ID to the AI function
            }
          });

          if (aiError) {
            console.error('Error calling AI:', aiError);
            toast({
              title: "AI Error",
              description: "Failed to get AI response",
              variant: "destructive",
            });
          } else {
            console.log('AI response received:', aiResponse);
          }
        } catch (aiError) {
          console.error('Error invoking AI function:', aiError);
          toast({
            title: "AI Error",
            description: "Failed to connect to AI service",
            variant: "destructive",
          });
        }
      }

      return { data: messageData, error: null };
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const handleChannelSelect = (channelName: string) => {
    console.log("Channel selected:", channelName);
    setActiveChannel(channelName);
    setShowFiles(false);

    if (!channelName.startsWith("dm-")) {
      setActiveDM(null);
    }
    fetchMessages(channelName);
  };

  const handleDMSelect = (userId: string) => {
    if (!session) return;
    console.log("DM selected:", userId);
    setActiveDM(userId);
    setShowFiles(false);
    const dmChannel = getDMChannelName(session.id, userId);
    fetchMessages(dmChannel);
  };

  const handleDebugRefresh = () => {
    console.log("Manual refresh triggered, counter:", debugCounter);
    setDebugCounter((c) => c + 1);
    fetchMessages();
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
    return <Auth />;
  }

  return (
    <div className="flex h-screen">
      <ChatLayout
        session={session}
        messages={messages}
        activeChannel={activeChannel}
        activeDM={activeDM}
        onSendMessage={handleSendMessage}
        onChannelSelect={handleChannelSelect}
        onDMSelect={handleDMSelect}
        onFilesClick={() => setShowFiles(true)}
        showFiles={showFiles}
      />
    </div>
  );
}

export default Index;
