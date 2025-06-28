import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import { StoreType } from "../../types/store";
import { Message } from "../../types/message"; // Ensure Message type is imported

export const Store = create<StoreType>()(
  persist(
    (set, get) => ({
      // Persisted state
      accessToken: null,
      user: null,
      currentReceiver: null,

      // Non-persisted state
      socket: null,
      friends: null,
      typing: null, // Consider if this should be an object { [chatId: string]: boolean | string }
      input: "", // This seems like local component state, but if global, okay.
      messagesByChat: {}, // Stores messages keyed by a chat ID (e.g., receiverId or a combined ID)

      // Actions
      setSocket: (socket) => set({ socket }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),

      setFriends: (friends) => set({ friends }),
      addFriend: (friend) => {
        const currentFriends = get().friends || [];
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
        if (get().currentReceiver?._id === updatedUser._id) {
          set({ currentReceiver: { ...get().currentReceiver, ...updatedUser } as StoreType['currentReceiver'] });
        }
        if (get().user?._id === updatedUser._id) {
            set({ user: { ...get().user, ...updatedUser } as StoreType['user'] });
        }
      },

      setTyping: (typing) // Consider new structure if typing is per chat
        => set({ typing }),
      setInput: (input) => set({ input }),

      // New message actions
      setChatMessages: (chatId: string, messages: Message[]) => {
        set((state) => ({
          messagesByChat: {
            ...state.messagesByChat,
            [chatId]: messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), // Sort messages by time
          }
        }));
      },
      addMessageToChat: (chatId: string, newMessage: Message) => {
        set((state) => {
          const chatMessages = state.messagesByChat[chatId] || [];
          // De-duplication based on _id
          if (!chatMessages.find(msg => msg._id === newMessage._id)) {
            const updatedChatMessages = [...chatMessages, newMessage];
            updatedChatMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // Sort messages
            return {
              messagesByChat: {
                ...state.messagesByChat,
                [chatId]: updatedChatMessages,
              }
            };
          }
          // If duplicate, log and return current state (or handle update if needed)
          console.warn(`[Store.addMessageToChat] Attempted to add duplicate message ID: ${newMessage._id} to chat ${chatId}`);
          return state;
        });
      },

      setCurrentReceiver: (receiver) => set({ currentReceiver: receiver }),
    }),
    {
      name: 'chat-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        currentReceiver: state.currentReceiver,
      }),
    }
  )
);
