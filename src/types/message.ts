export interface Message {
  id: number;
  content: string;
  sender: string;
  senderId?: string;
  timestamp: Date;
  channel: string | null;
  isDM?: boolean;
  recipientId?: string;
  replyCount: number;
  reactions: Record<string, string[]>;
  status?: "online" | "away" | "offline";
  attachment?: {
    name: string;
    url: string;
    type: string;
  };
  parentId?: number;  // Added this line to support thread replies
}