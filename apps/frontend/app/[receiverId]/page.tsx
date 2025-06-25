"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Store } from "../libs/globalState";
import { User } from "../../types/user";
import { Message } from "../../types/store"; // Assuming Message type is defined in store.ts or a similar place
import { initSocket, getSocket, sendMessage, sendTyping, sendStopTyping, sendSeen, disconnectSocket } from "../libs/socket";
import { getUsers as fetchUsers, getMessages as fetchMessages } from "../libs/requests"; // API requests

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const receiverId = params.receiverId as string;

  const {
    user: currentUser,
    accessToken,
    socket,
    messages,
    addMessage,
    setMessages,
    friends,
    setFriends,
    typing,
    setTyping,
    currentReceiver,
    setCurrentReceiver,
  } = Store();

  const [receiverUser, setReceiverUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null); // For scrolling to bottom
  const typingTimeoutRef = useRef<null | NodeJS.Timeout>(null);

  // Initialize socket connection
  useEffect(() => {
    if (accessToken && !socket) {
      initSocket();
    }

    // Cleanup on component unmount
    return () => {
      // Consider if socket should be disconnected here or managed globally
      // If many components use it, disconnecting here might be premature.
      // For a dedicated chat page, it might make sense.
      // disconnectSocket();
    };
  }, [accessToken, socket]);

  // Fetch users (friends) and set current receiver
  useEffect(() => {
    if (accessToken && (!friends || friends.length === 0)) {
      fetchUsers(accessToken)
        .then(setFriends)
        .catch(console.error);
    }
    if (friends && receiverId) {
      const foundReceiver = friends.find((f) => f._id === receiverId);
      if (foundReceiver) {
        setReceiverUser(foundReceiver);
        setCurrentReceiver(foundReceiver);
      } else if (receiverId === currentUser?._id) {
        // Handle case where user tries to chat with themselves if not allowed
        // router.push('/');
        console.warn("Attempting to chat with self or receiver not found in friends list.");
      }
    }
  }, [accessToken, friends, receiverId, setFriends, setCurrentReceiver, currentUser?._id]);

  // Fetch initial messages
  useEffect(() => {
    if (accessToken && receiverId && currentUser?._id) {
      // Only fetch if we have a valid receiver and current user
      fetchMessages(accessToken) // This API needs to be adjusted to fetch messages for a specific chat
        .then((allMessages) => {
          // Filter messages for the current chat
          const chatMessages = allMessages.filter(
            (msg: Message) =>
              (msg.senderId === currentUser._id && msg.receiverId === receiverId) ||
              (msg.senderId === receiverId && msg.receiverId === currentUser._id)
          );
          setMessages(chatMessages);
        })
        .catch(console.error);
    }
  }, [accessToken, receiverId, currentUser?._id, setMessages]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle incoming messages via socket
  useEffect(() => {
    const currentSocket = getSocket();
    if (currentSocket) {
      const messageListener = (newMessage: Message) => {
        // Ensure message is for the current chat
        if (
          (newMessage.senderId === currentUser?._id && newMessage.receiverId === receiverId) ||
          (newMessage.senderId === receiverId && newMessage.receiverId === currentUser?._id)
        ) {
          addMessage(newMessage);
          if (newMessage.senderId === receiverId && document.hidden) {
             // Optional: browser notification for new message when tab is not active
          }
          if (newMessage.senderId === receiverId) {
            sendSeen(receiverId); // Current user has seen this message from receiver
          }
        }
      };
      currentSocket.on('receive_message', messageListener);
      return () => {
        currentSocket.off('receive_message', messageListener);
      };
    }
  }, [currentUser?._id, receiverId, addMessage, socket]);


  const handleSendMessage = () => {
    if (newMessage.trim() && receiverId) {
      sendMessage(receiverId, newMessage.trim());
      setNewMessage("");
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendStopTyping(receiverId);
    }
  };

  const handleTyping = () => {
    if (!receiverId) return;
    sendTyping(receiverId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping(receiverId);
    }, 2000); // Stop typing if no input for 2 seconds
  };

  if (!currentUser) {
    // router.push('/login'); // Should be handled by middleware ideally
    return <p>Loading user...</p>;
  }

  if (!receiverUser && friends) {
    // If friends are loaded but receiver not found (and not self-chat)
    return <p>Receiver not found. Select a user to chat with.</p>;
  }
   if (!receiverUser && !friends) {
    return <p>Loading chat...</p>;
  }


  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-semibold">
          Chat with {receiverUser?.firstName || "User"}
        </h1>
        {typing === receiverId && <p className="text-sm text-blue-200 italic">typing...</p>}
      </header>

      {/* Messages Area */}
      <div className="flex-grow p-4 overflow-y-auto space-y-2 bg-gray-200">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`flex ${
              msg.senderId === currentUser._id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                msg.senderId === currentUser._id
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-800"
              }`}
            >
              <p>{msg.content}</p>
              <span className="text-xs opacity-75">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
              {/* Basic seen status - improve later */}
              {msg.senderId === currentUser._id && msg.seen && (
                <span className="text-xs opacity-75 ml-2">Seen</span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 shadow-up">
        <div className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-grow p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600 focus:outline-none"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
