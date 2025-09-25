/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  MessageSquare,
  Pencil,
  Trash2,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface ChatSidebarProps {
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
}

export function ChatSidebar({
  currentSessionId,
  onSessionSelect,
}: ChatSidebarProps) {
  const router = useRouter();
  const { status } = useSession();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const { data: sessionsData, refetch } = api.chat.getSessions.useQuery(
    {},
    { enabled: status === "authenticated" }
  );

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
    if (status !== "authenticated") {
      router.push("/auth/signin");
      return;
    }
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

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleDeleteSession = (sessionId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this conversation? This action cannot be undone."
      )
    ) {
      deleteSessionMutation.mutate({ sessionId });
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 3600);

    if (diffInHours < 24) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffInHours < 168) {
      // 7 days
      return d.toLocaleDateString([], { weekday: "short" });
    } else {
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <div className="flex h-full w-80 flex-col bg-slate-50/50 dark:bg-slate-950/50 border-r border-slate-200 dark:border-slate-800 min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900 dark:text-slate-100">
              Career Counselor
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              AI-powered career guidance
            </p>
          </div>
        </div>

        <Button
          onClick={handleNewChat}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200"
          disabled={
            createSessionMutation.isPending || status !== "authenticated"
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          {createSessionMutation.isPending ? "Creating..." : "New Chat"}
        </Button>

        {status === "unauthenticated" && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            Please sign in to create and access your chat history.
          </p>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {sessions.length === 0 && status === "authenticated" ? (
          <div className="p-4 text-center">
            <div className="py-8">
              <MessageSquare className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                No conversations yet
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Start a new chat to begin your career journey
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-3 cursor-pointer transition-all duration-200",
                  "hover:bg-white/70 dark:hover:bg-slate-800/70 hover:shadow-sm",
                  currentSessionId === session.id &&
                    "bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700"
                )}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                  <MessageSquare className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </div>

                {editingId === session.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTitle();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      className="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                      maxLength={50}
                    />
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                        onClick={handleSaveTitle}
                        disabled={updateTitleMutation.isPending}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => onSessionSelect(session.id)}
                    >
                      <div className="font-medium text-slate-900 dark:text-slate-100 truncate text-sm">
                        {session.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatDate(session.updatedAt.toISOString())} •{" "}
                        {session._count?.messages || 0} messages
                      </div>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTitle(session);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        disabled={deleteSessionMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Powered by AI • Built with care
          </p>
        </div>
      </div>
    </div>
  );
}
