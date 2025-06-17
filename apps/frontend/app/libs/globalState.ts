import { create } from "zustand";
import { StoreType } from "../../types/store";

export const Store = create<StoreType>((set, get) => ({
  socket: null,
  setSocket: (socket) => set({ socket }),

  accessToken: null,
  setAccessToken: (accessToken) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
    }
    set({ accessToken });
  },

  user: null,
  setUser: (user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
    }
    set({ user });
  },

  friends: null,
  setFriends: (friends) => set({ friends }),
  addFriend: (friend) => {
    const current = get().friends || [];
    set({ friends: [...current, friend] });
  },
  updateFriend: (user) => {
    const current = get().friends || [];
    const updated = current.map((f) => (f._id === user._id ? user : f));
    set({ friends: updated });
  },

  typing: null,
  setTyping: (typing) => set({ typing }),

  input: "",
  setInput: (input) => set({ input }),

  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => {
    const current = get().messages;
    set({ messages: [...current, message] });
  },

  currentReceiver: null,
  setCurrentReceiver: (receiver) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("currentReceiver", JSON.stringify(receiver));
    }
    set({ currentReceiver: receiver });
  },
}));
