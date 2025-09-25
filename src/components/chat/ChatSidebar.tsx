/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { useRouter } from "next/navigation";

interface ChatSidebarProps {
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
}

export function ChatSidebar({
  currentSessionId,
  onSessionSelect,
}: ChatSidebarProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const { data: sessionsData, refetch } = api.chat.getSessions.useQuery({});
  const createSessionMutation = api.chat.createSession.useMutation({
    onSuccess: (session) => {
      refetch();
      onSessionSelect(session.id);
      router.push(`/chat/${session.id}`);
    },
  });

  const updateTitleMutation = api.chat.updateSessionTitle.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
    },
  });

  const deleteSessionMutation = api.chat.deleteSession.useMutation({
    onSuccess: () => {
      refetch();
      if (currentSessionId === editingId) {
        router.push("/chat");
      }
    },
  });

  const sessions = sessionsData?.sessions || [];

  const handleNewChat = () => {
    createSessionMutation.mutate({});
  };

  const handleEditTitle = (session: any) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveTitle = () => {
    if (editingId && editTitle.trim()) {
      updateTitleMutation.mutate({
        sessionId: editingId,
        title: editTitle.trim(),
      });
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm("Are you sure you want to delete this chat?")) {
      deleteSessionMutation.mutate({ sessionId });
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/20">
      <div className="p-4">
        <Button
          onClick={handleNewChat}
          className="w-full"
          disabled={createSessionMutation.isLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-2 space-y-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-muted/60",
                currentSessionId === session.id && "bg-muted"
              )}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />

              {editingId === session.id ? (
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 bg-transparent border-none outline-none"
                  autoFocus
                />
              ) : (
                <div
                  className="flex-1 truncate"
                  onClick={() => onSessionSelect(session.id)}
                >
                  {session.title}
                </div>
              )}

              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleEditTitle(session)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => handleDeleteSession(session.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t text-xs text-muted-foreground">
        Career Counselor AI
      </div>
    </div>
  );
}
