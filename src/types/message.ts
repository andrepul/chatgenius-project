export interface Message {
  id: number;
  content: string;
  sender: string;
  senderId: string;
  timestamp: Date;
  channel: string | null;
  isDM: boolean | null;
  recipientId: string | null;
  replyCount: number | null;
  reactions: Record<string, string[]>;
  status?: "online" | "away" | "offline";
  attachment?: {
    name: string;
    url: string;
    type: string;
  };
  parentId?: number;
}