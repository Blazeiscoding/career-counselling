'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function ChatSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [currentSessionId, setCurrentSessionId] = useState<string>(sessionId);

  useEffect(() => {
    setCurrentSessionId(sessionId);
  }, [sessionId]);

  return (
    <div className="flex h-screen">
      <ChatSidebar
        currentSessionId={currentSessionId}
        onSessionSelect={setCurrentSessionId}
      />
      <div className="flex-1">
        <ChatInterface sessionId={currentSessionId} />
      </div>
    </div>
  );
}