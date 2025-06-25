"use client";

import { usePathname } from "next/navigation";
import Sidebar from "../Sidebar"; // Adjust path as necessary
import React from "react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showSidebar = !["/login", "/register"].includes(pathname);

  return (
    <div className="flex h-screen">
      {showSidebar && <Sidebar />}
      <main className="flex-grow h-full overflow-y-auto">{children}</main>
    </div>
  );
}
