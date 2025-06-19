"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

export const socket: Socket = io("http://localhost:3003");

export default function NoUserSelected() {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected to socket server");
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from socket server");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  return <div>Please select a user from the list.</div>;
}
