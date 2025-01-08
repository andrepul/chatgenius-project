export interface Message {
  id: number;
  content: string;
  sender: string;
  timestamp: Date;
  channel: string;
  replyCount?: number;
  parentId?: number;
  reactions: {
    [emoji: string]: string[];  // emoji -> array of user IDs who reacted
  };
} 