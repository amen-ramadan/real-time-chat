"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { getMessages, getUsers } from "./libs/requests";
import { Store } from "./libs/globalState";

export const socket: Socket = io("http://localhost:3003");

export default function NoUserSelected() {
  const {
    setFriends,
    addFriend,
    user,
    setMessages,
    addMessage,
    accessToken,
    setTyping,
    setUser,
    updateFriend,
    setCurrentReceiver,
    currentReceiver,
  } = Store();

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected to socket server");
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from socket server");
    });

    socket.on("user_created", (userCreated) => {
      if (userCreated._id !== user?._id) {
        addFriend(userCreated);
      }
    });

    socket.on("receive_message", (message) => {
      addMessage(message);
    });

    socket.on("typing", () => {
      setTyping(true);
    });

    socket.on("stop_typing", () => {
      setTyping(false);
    });

    socket.on("seen", (senderId) => {
      console.log("Seen", senderId);
    });

    socket.on("user_updated", (updatedUser) => {
      if (user?._id === updatedUser._id) {
        setUser(updatedUser);
      } else {
        updateFriend(updatedUser);
        if (currentReceiver?._id === updatedUser._id) {
          setCurrentReceiver(updatedUser);
        }
      }
    });

    const fetchData = async () => {
      if (!accessToken) return;

      const users = await getUsers(accessToken);
      const messages = await getMessages(accessToken);

      setFriends(users);
      setMessages(messages);
    };
    fetchData();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  return <div>Please select a user from the list.</div>;
}
