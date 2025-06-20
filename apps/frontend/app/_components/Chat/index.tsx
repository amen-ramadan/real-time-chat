"use client";

import { useEffect, useRef } from "react";
import ChatFooter from "./ChatFooter";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import { Store } from "../../libs/globalState";
import { usePathname } from "next/navigation";
import { getReceiverMessages } from "../../libs/filterMessages";

export default function Chat() {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { messages, user } = Store();

  const pathname = usePathname();
  const receiverId = pathname.slice(1);
  const receiverMessages = getReceiverMessages(messages, receiverId);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.addEventListener("DOMNodeInserted", (e) => {
        (e.currentTarget as HTMLElement).scroll({
          top: (e.currentTarget as HTMLElement).scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }, []);

  return (
    <div className="flex-[3] flex flex-col">
      <ChatHeader />
      <div
        className="px-8 py-6 flex-1 space-y-2 bg-[#0B141A] overflow-y-scroll h-8"
        ref={messagesContainerRef}
      >
        {receiverMessages?.map((message: any, i: number) => (
          <ChatMessage
            key={i}
            {...message}
            isSender={user?._id === message.senderId}
          />
        ))}
      </div>
      <ChatFooter />
    </div>
  );
}
