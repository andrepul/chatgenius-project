import { MessageSquare, Circle, Download } from "lucide-react";
import { Message } from "@/types/message";
import EmojiPicker from "./EmojiPicker";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ChatMessageProps {
  message: Message;
  showThread?: boolean;
  onThreadClick?: (message: Message) => void;
  onReaction?: (messageId: number, emoji: string) => void;
  currentUser?: string;
}

const ChatMessage = ({
  message,
  showThread = true,
  onThreadClick,
  onReaction,
  currentUser = "You",
}: ChatMessageProps) => {
  const [senderName, setSenderName] = useState<string>("Loading...");
  const [senderStatus, setSenderStatus] = useState<string>("offline");
  const reactions = message.reactions || {};
  
  useEffect(() => {
    const fetchSenderInfo = async () => {
      try {
        console.log('Fetching sender info for:', message.sender);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('username, status')
          .eq('id', message.sender)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          setSenderName('Unknown User');
          return;
        }

        if (profile?.username) {
          console.log('Found username:', profile.username, 'status:', profile.status);
          setSenderName(profile.username);
          setSenderStatus(profile.status || 'offline');
        } else {
          console.log('No username found, using Unknown User');
          setSenderName('Unknown User');
        }
      } catch (error) {
        console.error('Error in fetchSenderInfo:', error);
        setSenderName('Unknown User');
      }
    };

    fetchSenderInfo();

    // Subscribe to realtime status updates
    const statusSubscription = supabase
      .channel('profiles')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles',
          filter: `id=eq.${message.sender}` 
        }, 
        (payload: any) => {
          console.log('Profile status updated:', payload);
          setSenderStatus(payload.new.status || 'offline');
        }
      )
      .subscribe();

    return () => {
      statusSubscription.unsubscribe();
    };
  }, [message.sender]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online":
        return "text-green-500";
      case "away":
        return "text-yellow-500";
      case "offline":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  // Extract file name from content if it contains a file link
  const extractFileInfo = (content: string) => {
    const fileMatch = content.match(/\[File: (.*?)\]/);
    if (fileMatch) {
      return fileMatch[1];
    }
    return null;
  };

  // Clean message content by removing file markdown
  const cleanContent = (content: string) => {
    return content.replace(/\[File:.*?\]\(.*?\)/, '').trim();
  };

  // Extract URL from content
  const extractFileUrl = (content: string) => {
    const urlMatch = content.match(/\(([^)]+)\)/);
    return urlMatch ? urlMatch[1] : null;
  };

  const handleDownload = async (fileName: string, fileUrl: string) => {
    try {
      console.log('Downloading file:', fileName, 'from URL:', fileUrl);
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const fileName = extractFileInfo(message.content);
  const fileUrl = extractFileUrl(message.content);
  const cleanedContent = cleanContent(message.content);
  
  return (
    <div className="py-2 px-4 hover:bg-chat-hover">
      <div className="flex items-start space-x-3">
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
            {senderName[0].toUpperCase()}
          </div>
          <Circle 
            className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(senderStatus)} fill-current`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium">{senderName}</span>
            <span className="text-xs text-muted-foreground">
              {new Intl.DateTimeFormat([], {
                hour: "numeric",
                minute: "numeric",
              }).format(message.timestamp)}
            </span>
          </div>
          
          {/* Message content */}
          {cleanedContent && (
            <div className="break-words whitespace-pre-wrap overflow-hidden mb-2">
              {cleanedContent}
            </div>
          )}

          {/* File attachment */}
          {fileName && fileUrl && (
            <div 
              className="mt-2 flex items-center space-x-2 p-2 bg-accent rounded-lg w-fit cursor-pointer hover:bg-accent/80 transition-colors"
              onClick={() => handleDownload(fileName, fileUrl)}
            >
              <Download className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm hover:text-primary transition-colors">
                {fileName}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-1">
            {Object.entries(reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReaction?.(message.id, emoji)}
                className={`inline-flex items-center space-x-1 text-xs rounded-full px-2 py-1 ${
                  users.includes(currentUser)
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <span>{emoji}</span>
                <span>{users.length}</span>
              </button>
            ))}
            <EmojiPicker onEmojiSelect={(emoji) => onReaction?.(message.id, emoji)} />
            
            {showThread && (
              <button
                onClick={() => onThreadClick?.(message)}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <MessageSquare size={14} />
                {message.replyCount === 0
                  ? "Reply"
                  : `${message.replyCount} ${message.replyCount === 1 ? "reply" : "replies"}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;