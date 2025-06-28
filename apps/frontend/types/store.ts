import { User } from "./user";

export interface Friend {
  _id: string;
  [key: string]: any;
}

export interface StoreType {
  socket: any;
  setSocket: (socket: any) => void;

  accessToken: string | null;
  setAccessToken: (accessToken: string | null) => void;

  user: User | null;
  setUser: (user: User) => void;

  friends: Friend[] | null;
  setFriends: (friends: Friend[]) => void;
  addFriend: (friend: Friend) => void;
  updateFriend: (user: Friend) => void;

  typing: boolean;
  setTyping: (typing: boolean) => void;

  input: string;
  setInput: (input: string) => void;

  // Store messages as an object keyed by receiverId (or a unique chat ID)
  // Each value will be an array of Message objects for that chat.
  messagesByChat: { [chatId: string]: Message[] };
  setChatMessages: (chatId: string, messages: Message[]) => void;
  addMessageToChat: (chatId: string, message: Message) => void;
  // Optional: a way to clear messages for a chat or all chats
  // clearChatMessages: (chatId: string) => void;
  // clearAllChatMessages: () => void;

  currentReceiver: User | null;
  setCurrentReceiver: (receiver: User | null) => void; // Type 'any' changed to 'User | null'
}

// Import Message type
import { Message } from "./message";
