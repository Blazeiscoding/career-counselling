"use client";

import { useState } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  return (
    <div className="flex h-screen">
      <ChatSidebar
        currentSessionId={currentSessionId || undefined}
        onSessionSelect={setCurrentSessionId}
      />
      <div className="flex-1">
        {currentSessionId ? (
          <ChatInterface sessionId={currentSessionId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">
                Welcome to Career Counselor
              </h2>
              <p className="text-muted-foreground">
                Select a chat from the sidebar or start a new conversation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
