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

  messages: string[];
  setMessages: (messages: string[]) => void;
  addMessage: (message: string) => void;

  currentReceiver: User | null;
  setCurrentReceiver: (receiver: any) => void;
}
