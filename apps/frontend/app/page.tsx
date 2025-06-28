"use client";

import { useEffect } from "react";
import { Store } from "./libs/globalState";
// Corrected: Removed getMessages, getUsers is still valid. Socket init is handled globally.
import { getUsers } from "./libs/requests";
// Removed io and Socket as this component should not manage its own socket instance

export default function NoUserSelected() {
  const {
    setFriends,
    addFriend,
    user,
    // Removed setMessages, addMessage as they are replaced by per-chat versions
    // If this page needs to react to new messages, it should observe messagesByChat or have specific logic
    accessToken,
    // setTyping might also need context if it's per-chat
    setTyping,
    setUser,
    updateFriend,
    setCurrentReceiver,
    currentReceiver,
  } = Store();

  useEffect(() => {
    // Socket initialization and global event listeners should be handled by a higher-level component
    // or by the initSocket() function in socket.ts which should ideally register global handlers
    // that update the Zustand store directly. This component should not manage its own socket instance
    // or global listeners if a global socket is intended.

    // For now, we will remove the local socket instance and its listeners from this page.
    // The global socket listeners (if set up correctly in socket.ts or AppLayout/ChatPage)
    // should handle `user_created`, `receive_message`, `user_updated` by updating the Zustand store.
    // This component will then react to store changes.

    // Fetch initial users if needed (e.g., if not already fetched by Sidebar or another component)
    const fetchData = async () => {
      if (!accessToken) {
        console.log("[NoUserSelectedPage] No access token, skipping user fetch.");
        return;
      }
      // Check if friends are already in the store to avoid redundant fetches
      if (!Store.getState().friends || Store.getState().friends.length === 0) {
        console.log("[NoUserSelectedPage] Fetching users...");
        try {
          const users = await getUsers(accessToken);
          setFriends(users);
        } catch (error) {
          console.error("[NoUserSelectedPage] Error fetching users:", error);
        }
      } else {
        console.log("[NoUserSelectedPage] Users (friends) already in store.");
      }
      // Do NOT fetch all messages here. Messages are fetched per chat in ChatPage.
      // Do NOT call setMessages or addMessage here as they are deprecated.
    };

    if (user) { // Only fetch data if user is logged in (user object is in store)
        fetchData();
    } else {
        console.log("[NoUserSelectedPage] No current user in store, waiting for user data.");
        // Logic to handle redirection to login if user is null after a while might be needed,
        // but middleware should cover route protection.
    }

    // If this page needs to react to specific socket events not covered by global handlers,
    // it should get the socket instance via `getSocket()` from `libs/socket.ts`
    // and add/remove listeners carefully.
    // For now, removing all local socket logic.

  }, [accessToken, user, setFriends]); // Dependencies for fetching user list

  return <div className="p-4 text-center text-gray-500">Please select a user from the list to start a conversation.</div>;
}
