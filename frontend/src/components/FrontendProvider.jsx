'use client';

import { SocketProvider } from "@/context/SocketContext";

export default function FrontendProvider({
  children,
}) {
  return (
    <SocketProvider>
      {children}
    </SocketProvider>
  );
}