import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import { StoreType } from "../../types/store"; // Ensure Message type is part of StoreType if messages are here

export const Store = create<StoreType>()(
  persist(
    (set, get) => ({
      // Persisted state
      accessToken: null,
      user: null,
      currentReceiver: null, // Persisting currentReceiver as well

      // Non-persisted state (or state that is re-fetched/session-specific)
      socket: null,
      friends: null,
      typing: null,
      input: "",
      messages: [], // Messages are typically fetched for a specific chat session

      // Actions
      setSocket: (socket) => set({ socket }),
      setAccessToken: (accessToken) => set({ accessToken }), // localStorage is handled by persist middleware
      setUser: (user) => set({ user }), // localStorage is handled by persist middleware

      setFriends: (friends) => set({ friends }),
      addFriend: (friend) => {
        const currentFriends = get().friends || [];
        // Avoid adding if friend already exists
        if (!currentFriends.find(f => f._id === friend._id)) {
          set({ friends: [...currentFriends, friend] });
        }
      },
      updateFriend: (updatedUser) => {
        const currentFriends = get().friends || [];
        set({
          friends: currentFriends.map((f) =>
            f._id === updatedUser._id ? { ...f, ...updatedUser } : f
          ),
        });
        // Also update currentReceiver if it's the user being updated
        if (get().currentReceiver?._id === updatedUser._id) {
          set({ currentReceiver: { ...get().currentReceiver, ...updatedUser } });
        }
        // Also update the main user if it's the one being updated
        if (get().user?._id === updatedUser._id) {
            set({ user: { ...get().user, ...updatedUser } });
        }
      },

      setTyping: (typing) => set({ typing }),
      setInput: (input) => set({ input }),

      setMessages: (messages) => set({ messages }),
      addMessage: (message) => {
        const currentMessages = get().messages;
        set({ messages: [...currentMessages, message] });
      },

      setCurrentReceiver: (receiver) => set({ currentReceiver: receiver }), // localStorage handled by persist
    }),
    {
      name: 'chat-app-storage', // Name for localStorage key
      storage: createJSONStorage(() => localStorage), // Specify localStorage
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        currentReceiver: state.currentReceiver, // Persisting currentReceiver
      }),
      // Optional: Add a version number for migrations if state shape changes
      // version: 1,
      // migrate: (persistedState, version) => { ... }
    }
  )
);
