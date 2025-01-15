import { Message } from "@/types/message";
import { Avatar } from "./ui/avatar";
import { MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
  onThreadClick?: (message: Message) => void;
}

const ChatMessage = ({ message, isCurrentUser, onThreadClick }: ChatMessageProps) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    const fetchFileDetails = async () => {
      if (message.fileId) {
        try {
          // Get file details from the files table
          const { data: fileData, error: fileError } = await supabase
            .from('files')
            .select('*')
            .eq('id', message.fileId)
            .single();

          if (fileError) throw fileError;

          // Get the download URL
          const { data: { publicUrl }, error: urlError } = await supabase
            .storage
            .from('files')
            .getPublicUrl(fileData.storage_path);

          if (urlError) throw urlError;

          setFileUrl(publicUrl);
          setFileName(fileData.name);
        } catch (error) {
          console.error('Error fetching file details:', error);
        }
      }
    };

    fetchFileDetails();
  }, [message.fileId]);

  return (
    <div className={`flex items-start space-x-2 p-4 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
      <Avatar className="w-8 h-8" />
      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{message.sender}</span>
          <span className="text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className={`mt-1 rounded-lg p-3 ${
          isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}>
          <p>{message.content}</p>
          {fileUrl && fileName && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center space-x-2 text-sm text-blue-500 hover:underline"
            >
              <span>📎 {fileName}</span>
            </a>
          )}
        </div>
        {onThreadClick && message.replyCount !== undefined && message.replyCount > 0 && (
          <button
            onClick={() => onThreadClick(message)}
            className="mt-1 flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <MessageSquare size={14} />
            <span>{message.replyCount} replies</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;