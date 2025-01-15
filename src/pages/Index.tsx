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

  // Fetch initial session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Session error:", error);
        setError(error.message);
      } else {
        setSession(session?.user ?? null);
        if (session?.user) {
          fetchMessages();
        }
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user ?? null);
      if (session?.user) {
        fetchMessages();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Only one subscription: filtered by activeChannel or activeDM
  useEffect(() => {
    if (!session?.id) return;

    const channelFilter = activeDM
      ? `channel=eq.${getDMChannelName(session.id, activeDM)}`
      : `channel=eq.${activeChannel}`;

    const channel = supabase
      .channel("filtered-messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: channelFilter,
        },
        (payload) => {
          console.log("New message received:", payload);
          if (payload.eventType === "INSERT") {
            const msg = payload.new;
            setMessages((prev) => [
              ...prev,
              {
                id: msg.id,
                content: msg.content,
                sender: msg.sender_id,
                senderId: msg.sender_id,
                timestamp: new Date(msg.created_at),
                channel: msg.channel,
                isDM: msg.is_dm,
                recipientId: msg.recipient_id,
                replyCount: msg.reply_count || 0,
                reactions: msg.reactions || {},
                parentId: msg.parent_id,
              },
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [activeChannel, activeDM, session?.id]);

  const fetchMessages = async (channelName?: string) => {
    try {
      if (!session?.id) return;

      let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (channelName) {
        query = query.eq("channel", channelName);
      } else if (activeDM) {
        query = query.eq("channel", getDMChannelName(session.id, activeDM));
      } else {
        query = query.eq("channel", activeChannel);
      }

      const { data, error } = await query;
      if (error) throw error;

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

      setMessages(convertedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  // Send normal messages
  const handleSendMessage = async (content: string, file?: File) => {
    if (!session) return;
    try {
      // (Omitted: Optional file upload logic)

      const currentChannel = activeDM
        ? getDMChannelName(session.id, activeDM)
        : activeChannel;

      const messageData = {
        content,
        sender_id: session.id,
        channel: currentChannel,
        is_dm: !!activeDM,
        recipient_id: activeDM || null,
        reactions: {},
      };

      console.log("Sending message with data:", messageData);
      const { data, error } = await supabase
        .from("messages")
        .insert([messageData])
        .select()
        .single();

      if (error) throw error;

      console.log("Message sent successfully:", data);
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
        parentId: data.parent_id,
      };

      // Update messages immediately so the sender sees it.
      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Switch channels
  const handleChannelSelect = (channelName: string) => {
    console.log("Channel selected:", channelName);
    setActiveChannel(channelName);
    setShowFiles(false);

    if (!channelName.startsWith("dm-")) {
      setActiveDM(null);
    }
    fetchMessages(channelName);
  };

  // Switch to a DM
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
    <>
      <button onClick={handleDebugRefresh}>
        Refresh Messages
      </button>
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
    </>
  );
}

export default Index;