// components/InitializeStore.tsx
"use client";
import { useEffect } from "react";
import { Store } from "../libs/globalState";

export default function InitializeStore() {
  const setUser = Store((s) => s.setUser);
  const setAccessToken = Store((s) => s.setAccessToken);
  const setCurrentReceiver = Store((s) => s.setCurrentReceiver);

  useEffect(() => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    const receiver = localStorage.getItem("currentReceiver");

    if (user) setUser(JSON.parse(user));
    if (token) setAccessToken(token);
    if (receiver) setCurrentReceiver(JSON.parse(receiver));
  }, []);

  return null;
}
