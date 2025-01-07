import React from "react";
import { Message } from "@/types/message";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

interface ThreadViewProps {
  parentMessage?: Message;
  messages: Message[];
  onClose: () => void;
  onSendReply: (content: string, parentId: number) => void;
}

function ThreadView({ parentMessage, messages, onClose, onSendReply }: ThreadViewProps) {
  if (!parentMessage) return null;

  const childMessages = messages.filter((m) => m.parentId === parentMessage.id);

  return (
    <div className="absolute right-0 top-0 w-96 h-full bg-white border-l p-4">
      <button onClick={onClose} className="mb-2 text-sm underline">
        Close
      </button>
      <h2 className="font-semibold">Thread for message #{parentMessage.id}</h2>

      {/* Parent message */}
      <ChatMessage message={parentMessage} showThread={false} />

      {/* Child messages in the thread */}
      <div className="mt-4 space-y-2">
        {childMessages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} showThread={false} />
        ))}
      </div>

      {/* Reply input for this thread */}
      <div className="mt-4">
        <ChatInput
          onSendMessage={(content) => onSendReply(content, parentMessage.id)}
          activeChannel={parentMessage.channel}
          placeholder="Reply in thread..."
        />
      </div>
    </div>
  );
}

export default ThreadView; 