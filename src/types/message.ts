export interface Message {
  id: number;
  content: string;
  sender: string;
  timestamp: Date;
  channel: string | null;
  isDM?: boolean;
  recipientId?: string;
  replyCount?: number;
  parentId?: number;
  reactions: {
    [emoji: string]: string[];
  };
  status?: "online" | "offline" | "away";
  attachment?: {
    name: string;
    url: string;
    type: string;
  };
}