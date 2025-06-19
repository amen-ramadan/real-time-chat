"use client";

import { useParams } from "next/navigation";

export default function Chat() {
  const params = useParams();
  const receiverId = params.receiverId;

  return <div>Chat with user {receiverId}</div>;
}
