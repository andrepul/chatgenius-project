import { useState, useRef } from "react";
import { Send, Paperclip } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string, attachment?: File) => void;
  activeChannel: string;
  placeholder?: string;
}

const ChatInput = ({ onSendMessage, activeChannel, placeholder }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || selectedFile) {
      onSendMessage(message, selectedFile || undefined);
      setMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
      {selectedFile && (
        <div className="mb-2 px-3 py-2 bg-accent rounded-lg flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>
      )}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder || `Message #${activeChannel}`}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <Paperclip size={20} className="text-muted-foreground" />
        </button>
        <button
          type="submit"
          className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  );
};

export default ChatInput;