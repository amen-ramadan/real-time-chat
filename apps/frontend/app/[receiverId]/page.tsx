"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Store } from "../libs/globalState";
import { User } from "../../types/user";
import { Message } from "../../types/message"; // Corrected import
import { initSocket, getSocket, sendMessage, sendTyping, sendStopTyping, sendSeen } from "../libs/socket";
// Import renamed function
import { getUsers as fetchUsers, getMessagesForChat as fetchChatMessages } from "../libs/requests";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const receiverId = params.receiverId as string;

  const {
    user: currentUser,
    accessToken,
    socket,
    messagesByChat,
    setChatMessages,
    addMessageToChat,
    friends,
    setFriends,
    typing, // Assuming typing is global or needs per-chat logic later
    // setTyping, // setTyping might need adjustment if it's per-chat
    currentReceiver,
    setCurrentReceiver,
  } = Store();

  // Get messages for the current chat from the store
  const currentChatMessages = (receiverId && messagesByChat[receiverId]) ? messagesByChat[receiverId] : [];

  const [receiverUser, setReceiverUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const typingTimeoutRef = useRef<null | NodeJS.Timeout>(null);

  // Initialize socket connection
  useEffect(() => {
    if (accessToken && !socket) {
      console.log("[ChatPage] Initializing socket...");
      initSocket();
    }
    // Consider disconnectSocket in cleanup if appropriate for app lifecycle
  }, [accessToken, socket]);

  // Fetch users (friends) and set current receiver based on receiverId from params
  useEffect(() => {
    if (accessToken && (!friends || friends.length === 0)) {
      console.log("[ChatPage] Fetching users (friends)...");
      fetchUsers(accessToken)
        .then(setFriends)
        .catch(err => console.error("[ChatPage] Error fetching users:", err));
    }
    if (friends && receiverId) {
      const foundReceiver = friends.find((f) => f._id === receiverId);
      if (foundReceiver) {
        console.log("[ChatPage] Setting current receiver:", foundReceiver.firstName);
        setReceiverUser(foundReceiver); // Local state for header display
        setCurrentReceiver(foundReceiver); // Global state
      } else if (receiverId !== currentUser?._id) {
        console.warn(`[ChatPage] Receiver with ID ${receiverId} not found in friends list.`);
        // Optionally redirect or show a "user not found" message
        // router.push('/');
      }
    }
  }, [accessToken, friends, receiverId, setFriends, setCurrentReceiver, currentUser?._id]);

  // Fetch initial messages for the current chat
  useEffect(() => {
    if (accessToken && receiverId && currentUser?._id) {
      // Only fetch if messages for this chat aren't already loaded or are empty
      if (!messagesByChat[receiverId] || messagesByChat[receiverId].length === 0) {
        console.log(`[ChatPage] Fetching messages for chat with ${receiverId}`);
        // Use the updated fetchChatMessages function that takes receiverId
        fetchChatMessages(accessToken, receiverId)
          .then((chatMessages: Message[]) => {
            // Backend now returns messages filtered for this specific chat
            console.log(`[ChatPage] Fetched ${chatMessages.length} messages for chat with ${receiverId}.`);
            setChatMessages(receiverId, chatMessages);
          })
          .catch(error => console.error(`[ChatPage] Error fetching messages for ${receiverId}:`, error));
      } else {
        console.log(`[ChatPage] Messages for chat with ${receiverId} already in store. Count: ${messagesByChat[receiverId].length}`);
      }
    }
  }, [accessToken, receiverId, currentUser?._id, setChatMessages, messagesByChat]);

  // Scroll to bottom of messages when new messages are added to the current chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChatMessages]);

  // Handle incoming messages via socket (global listener for all messages)
  useEffect(() => {
    const currentSocket = getSocket();
    if (currentSocket && currentUser?._id) {
      const messageListener = (newMessage: Message) => {
        console.log('[ChatPage] Global receive_message listener invoked with:', newMessage);

        let targetChatId: string | null = null;
        if (newMessage.senderId === currentUser._id) { // Message sent BY current user TO someone
          targetChatId = newMessage.receiverId;
        } else if (newMessage.receiverId === currentUser._id) { // Message received BY current user FROM someone
          targetChatId = newMessage.senderId;
        }

        if (targetChatId) {
          console.log(`[ChatPage] Adding message to chat ${targetChatId}:`, newMessage);
          addMessageToChat(targetChatId, newMessage);

          // If this message is for the currently open chat, and was sent by the other person
          if (targetChatId === receiverId && newMessage.senderId === receiverId) {
            if (document.hidden) {
              // Optional: browser notification for new message when tab is not active
              console.log(`[ChatPage] Document hidden, new message from ${receiverId} for current chat.`);
            }
            // Mark as seen (current user has seen this message from receiverId)
            console.log(`[ChatPage] Sending 'seen' for message from ${receiverId}`);
            sendSeen(receiverId);
          }
        } else {
          console.warn('[ChatPage] Received message not involving current user, or IDs are undefined:', newMessage);
        }
      };

      console.log(`[ChatPage] Setting up global 'receive_message' listener on socket: ${currentSocket.id}`);
      currentSocket.on('receive_message', messageListener);
      return () => {
        console.log(`[ChatPage] Cleaning up global 'receive_message' listener on socket: ${currentSocket.id}`);
        currentSocket.off('receive_message', messageListener);
      };
    }
  }, [socket, currentUser?._id, addMessageToChat, sendSeen, receiverId]); // receiverId is needed for the sendSeen logic for current chat


  const handleSendMessage = () => {
    console.log('[ChatPage] handleSendMessage called. Message:', newMessage);
    if (newMessage.trim() && receiverId && currentUser?._id) {
      // Optimistically add to local state first? Or wait for server ack?
      // Current setup waits for server to broadcast it back via 'receive_message'.
      sendMessage(receiverId, newMessage.trim());
      setNewMessage("");
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendStopTyping(receiverId); // Inform receiver that typing stopped
    }
  };

  const handleTyping = () => {
    if (!receiverId) return;
    sendTyping(receiverId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping(receiverId);
    }, 2000);
  };

  if (!currentUser) {
    return <p className="p-4">Loading user information...</p>;
  }

  // If receiverId is present but receiverUser (from friends list) is not yet found
  if (receiverId && !receiverUser && friends && friends.length > 0 && currentUser._id !== receiverId) {
     return <p className="p-4">User not found in your contacts or still loading.</p>;
  }
  // If friends are loaded, but receiverId is not in friends (and not self)
  if (receiverId && friends && !friends.find(f => f._id === receiverId) && currentUser._id !== receiverId) {
    return <p className="p-4">Selected user not in contacts.</p>;
  }
  // Initial loading state for receiver or if trying to chat with self (if not desired)
   if (!receiverUser && receiverId !== currentUser?._id) { // If receiverId is present but receiverUser is not resolved yet
    return <p className="p-4">Loading chat with user...</p>;
  }
   if (receiverId === currentUser?._id) { // Optional: UI for chatting with self / saved messages
     return <p className="p-4">Chatting with yourself (Saved Messages).</p>;
   }
   if (!receiverId || !receiverUser) { // If no receiver selected, or receiverUser is null (e.g. initial state before friends load)
     return <p className="p-4">Select a user to start chatting.</p>; // Should be handled by redirecting to a page like '/'
   }


  return (
    <div className="flex flex-col h-full bg-bg-primary text-white w-full">
      {/* Header */}
      <header className="bg-bg-secondary p-4 shadow-md flex items-center space-x-3">
        {receiverUser?.profilePicture ? (
            <Image src={receiverUser.profilePicture} alt="Receiver Avatar" width={40} height={40} className="rounded-full" />
        ) : (
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl font-semibold">
                {receiverUser?.firstName?.charAt(0).toUpperCase()}
            </div>
        )}
        <div>
            <h1 className="text-xl font-semibold">
            {receiverUser?.firstName || "Chat"} {receiverUser?.lastName || ""}
            </h1>
            {typing === receiverId && <p className="text-sm text-green-400 italic">typing...</p>}
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-grow p-4 overflow-y-auto space-y-2 bg-bg-primary">
        {currentChatMessages.map((msg) => (
          <div
            key={msg._id} // Key comes from the message object
            className={`flex mb-2 ${
              msg.senderId === currentUser._id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow ${
                msg.senderId === currentUser._id
                  ? "bg-send-message-bg text-white rounded-br-none"
                  : "bg-bg-secondary text-white rounded-bl-none"
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <span className="text-xs text-gray-400 mt-1 block text-right">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
              {/* Basic seen status - TODO: improve later with checkmarks */}
              {/* {msg.senderId === currentUser._id && msg.seen && (
                <span className="text-xs text-gray-400 ml-2">Seen</span>
              )} */}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-bg-secondary p-2 sm:p-4 border-t border-border-primary">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage();}}}
            placeholder="Type a message..."
            className="flex-grow p-3 bg-bg-input rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-white placeholder-gray-400"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
