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
  const [showFiles, setShowFiles] = useState(false);
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

  const fetchMessages = async (channel?: string) => {
    console.log('Fetching messages for channel:', channel || activeChannel);
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      // Filter messages by channel
      if (channel) {
        query = query.eq('channel', channel);
      } else if (activeDM) {
        query = query.eq('channel', `dm-${activeDM}`);
      } else if (activeChannel) {
        query = query.eq('channel', activeChannel);
      }

      const { data, error } = await query;

      if (error) throw error;

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

    try {
      let fileData;
      if (file) {
        // Create a unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        // Upload to Supabase storage with metadata
        const { error: uploadError } = await supabase
          .storage
          .from('files')
          .upload(filePath, file, {
            metadata: {
              user_id: session.id,
              contentType: file.type,
              filename: file.name
            }
          });

        if (uploadError) throw uploadError;

        // Get signed URL
        const { data: { signedUrl }, error: signedUrlError } = await supabase
          .storage
          .from('files')
          .createSignedUrl(filePath, 3600);

        if (signedUrlError) throw signedUrlError;

        // Save file metadata to database
        const { data, error: fileError } = await supabase
          .from('files')
          .insert([{
            name: file.name,
            storage_path: filePath,
            type: file.type,
            size: file.size,
            uploaded_by: session.id,
            channel: activeDM ? null : activeChannel,
            is_dm: !!activeDM,
            recipient_id: activeDM || null,
            url: signedUrl
          }])
          .select()
          .single();

        if (fileError) throw fileError;
        fileData = data;

        // Add file reference to message content
        content = `${content} [File: ${file.name}](${signedUrl})`;
      }

      const currentChannel = activeDM ? `dm-${activeDM}` : activeChannel;
      const messageData = {
        content,
        sender_id: session.id,
        channel: currentChannel,
        is_dm: !!activeDM,
        recipient_id: activeDM || null,
        reactions: {},
        ...(fileData && { file_id: fileData.id })  // Only include file_id if we have a file
      };

      console.log('Sending message with data:', messageData);
      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();

      if (error) throw error;

      console.log('Message sent successfully:', data);
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
        parentId: data.parent_id
      };

      setMessages(prev => [...prev, newMessage]);
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
    setShowFiles(false);
    if (!channelName.startsWith('dm-')) {
      setActiveDM(null);
    }
    fetchMessages(channelName);
  };

  const handleDMSelect = (userId: string) => {
    console.log('DM selected:', userId);
    setActiveDM(userId);
    setShowFiles(false);
    fetchMessages(`dm-${userId}`);
  };

  const handleFilesClick = () => {
    setShowFiles(true);
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
      onFilesClick={handleFilesClick}
      showFiles={showFiles}
    />
  );
}

export default Index;