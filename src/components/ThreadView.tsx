import React from "react";
import { Message } from "@/types/message";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { X } from "lucide-react";

interface ThreadViewProps {
  parentMessage?: Message;
  messages: Message[];
  onClose: () => void;
  onSendReply: (content: string, parentId: number, attachment?: File) => void;
}

function ThreadView({ parentMessage, messages, onClose, onSendReply }: ThreadViewProps) {
  if (!parentMessage) return null;

  // Get the root parent message (the one that started the thread)
  const getRootParentId = (message: Message): number => {
    console.log('Finding root parent for message:', message);
    const parent = messages.find(m => m.id === message.parentId);
    if (!parent || !parent.parentId) {
      const rootId = message.parentId || message.id;
      console.log('Root parent found:', rootId);
      return rootId;
    }
    return getRootParentId(parent);
  };

  // Get all messages in this thread
  const rootParentId = getRootParentId(parentMessage);
  console.log('Root parent ID:', rootParentId);
  
  const threadMessages = messages.filter(m => {
    const isRootMessage = m.id === rootParentId;
    const isDirectReply = m.parentId === rootParentId;
    const isClickedMessage = m.id === parentMessage.id;
    const isReplyToClicked = m.parentId === parentMessage.id;
    
    const included = isRootMessage || isDirectReply || isClickedMessage || isReplyToClicked;
    if (included) {
      console.log('Including message in thread:', m);
    }
    return included;
  }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  console.log('Thread messages:', threadMessages);

  return (
    <div className="fixed right-0 top-0 w-96 h-full bg-white border-l shadow-lg flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-semibold">Thread</h2>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {threadMessages.map((msg) => (
          <ChatMessage 
            key={msg.id} 
            message={msg} 
            showThread={false}
          />
        ))}
      </div>

      <div className="border-t">
        <ChatInput
          onSendMessage={(content, attachment) => onSendReply(content, parentMessage.id, attachment)}
          activeChannel={parentMessage.channel || ""}
          placeholder="Reply in thread..."
        />
      </div>
    </div>
  );
}

export default ThreadView;