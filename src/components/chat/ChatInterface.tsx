/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Send, User, Bot, Sparkles, ArrowUp } from "lucide-react";
import { cn } from "@/utils/cn";
import { MESSAGE_CONSTANTS } from "@/lib/constants";

interface ChatInterfaceProps {
  sessionId: string;
}

export function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const suggestedPrompts = [
    "💼 Help me choose a career path",
    "📝 Review my resume for a software role", 
    "🔄 How do I switch from sales to product management?",
    "🎯 Prep me for a data analyst interview",
  ];

  const { data: messagesData, refetch } = api.chat.getMessages.useQuery({
    sessionId,
  });

  // Optimistic in-flight messages for streaming UI
  const [optimisticUserMsg, setOptimisticUserMsg] = useState<
    | null
    | { id: string; role: "USER"; content: string; createdAt: string }
  >(null);
  const [optimisticAssistantMsg, setOptimisticAssistantMsg] = useState<
    | null
    | { id: string; role: "ASSISTANT"; content: string; createdAt: string }
  >(null);

  const messages = messagesData?.messages || [];
  const visibleMessages = [
    ...messages,
    ...(optimisticUserMsg ? [optimisticUserMsg] : []),
    ...(optimisticAssistantMsg ? [optimisticAssistantMsg] : []),
  ];

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
    }
  }, [input]);

  // Enhanced Markdown renderer with better styling
  const renderMarkdownInline = (text: string): React.ReactNode[] => {
    // Phase 1: Links [label](url)
    const parts = text.split(/(\[[^\]]+\]\([^\)]+\))/g);
    const linkNodes: (string | React.ReactNode)[] = [];
    parts.forEach((part, i) => {
      const m = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
      if (m) {
        const label = m[1];
        const url = m[2];
        linkNodes.push(
          <a 
            key={`lnk-${i}`} 
            href={url} 
            target="_blank" 
            rel="noreferrer" 
            className="text-blue-500 hover:text-blue-600 underline underline-offset-2 font-medium transition-colors"
          >
            {label}
          </a>
        );
      } else {
        linkNodes.push(part);
      }
    });

    // Phase 2: inline code, bold, italics
    const result: React.ReactNode[] = [];
    linkNodes.forEach((node, idxBase) => {
      if (typeof node !== "string") {
        result.push(node);
        return;
      }

      // Inline code `code`
      const codeSplit = node.split(/(`[^`]+`)/g);
      codeSplit.forEach((seg, i) => {
        if (seg.startsWith("`") && seg.endsWith("`")) {
          const code = seg.slice(1, -1);
          result.push(
            <code 
              key={`code-${idxBase}-${i}`} 
              className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-900 dark:text-slate-100 font-medium"
            >
              {code}
            </code>
          );
        } else {
          // Bold **text** inside this plain segment
          const boldSplit = seg.split(/(\*\*[^*]+\*\*)/g);
          boldSplit.forEach((bseg, j) => {
            if (bseg.startsWith("**") && bseg.endsWith("**")) {
              result.push(
                <strong 
                  key={`b-${idxBase}-${i}-${j}`} 
                  className="font-semibold text-slate-900 dark:text-slate-100"
                >
                  {bseg.slice(2, -2)}
                </strong>
              );
            } else {
              // Italic *text*
              const italSplit = bseg.split(/(\*[^*]+\*)/g);
              italSplit.forEach((iseg, k) => {
                if (iseg.startsWith("*") && iseg.endsWith("*")) {
                  result.push(
                    <em key={`i-${idxBase}-${i}-${j}-${k}`} className="italic">
                      {iseg.slice(1, -1)}
                    </em>
                  );
                } else if (iseg) {
                  result.push(iseg);
                }
              });
            }
          });
        }
      });
    });
    return result;
  };

  const renderMessage = (content: string) => {
    // Split by lines and render with <br />
    const lines = content.split(/\r?\n/);
    return (
      <>
        {lines.map((line, idx) => (
          <span key={`ln-${idx}`}>
            {renderMarkdownInline(line)}
            {idx < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </>
    );
  };

  const scrollToBottom = (opts: ScrollToOptions = { behavior: "smooth" }) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, ...opts });
  };

  useEffect(() => {
    if (visibleMessages.length > 0 || optimisticUserMsg || optimisticAssistantMsg) {
      scrollToBottom();
    }
  }, [visibleMessages, optimisticUserMsg, optimisticAssistantMsg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const content = input.trim();
    setIsLoading(true);
    setOptimisticUserMsg({
      id: "optimistic-user",
      role: "USER", 
      content,
      createdAt: new Date().toISOString(),
    });
    setOptimisticAssistantMsg({
      id: "optimistic-assistant",
      role: "ASSISTANT",
      content: "",
      createdAt: new Date().toISOString(),
    });
    setInput("");

    let hasError = false;
    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content }),
      });

      if (!res.ok) {
        // Try to get error message from response
        let errorMessage = "Streaming request failed";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(`${errorMessage} (Status: ${res.status})`);
      }

      if (!res.body) {
        throw new Error("Response body is null - streaming not available");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setOptimisticAssistantMsg((prev) =>
            prev ? { ...prev, content: prev.content + chunk } : prev
          );
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      hasError = true;
      console.error("Failed to stream response:", error);
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setOptimisticAssistantMsg((prev) =>
        prev ? { 
          ...prev, 
          content: `⚠️ Error: ${errorMessage}. Please try again.` 
        } : null
      );
      // Refetch to get any messages that were saved
      void refetch();
    } finally {
      setIsLoading(false);
      setOptimisticUserMsg(null);
      // Clear optimistic assistant message after a delay to show error, or immediately if success
      if (hasError) {
        setTimeout(() => {
          setOptimisticAssistantMsg(null);
        }, MESSAGE_CONSTANTS.ERROR_MESSAGE_DISPLAY_TIME);
      } else {
        setOptimisticAssistantMsg(null);
        void refetch();
      }
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-950/50 dark:to-slate-900">
      {/* Messages */}
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto">
        {visibleMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center max-w-lg">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Welcome to Career Counselor
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                I'm your AI career counselor, ready to help you navigate your professional journey. 
                What would you like to explore today?
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt.replace(/^\S+\s/, ''))} // Remove emoji
                    className="group p-4 text-left rounded-xl border border-slate-200 dark:border-slate-700 
                             bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 
                             hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200
                             hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{prompt.match(/^\S+/)?.[0]}</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {prompt.replace(/^\S+\s/, '')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
            {visibleMessages.map((message, idx) => {
              const prev = visibleMessages[idx - 1];
              const isUser = message.role === "USER";
              const isGroupStart = !prev || prev.role !== message.role;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4",
                    isUser ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "flex max-w-[85%] sm:max-w-[75%]",
                      isUser ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full shadow-sm border-2",
                        isUser
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-200 dark:border-blue-400 text-white"
                          : "bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-200 dark:border-emerald-400 text-white"
                      )}
                    >
                      {isUser ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </div>

                    <div className={cn("space-y-1", isUser ? "mr-3" : "ml-3")}>
                      <div
                        className={cn(
                          "px-4 py-3 text-sm shadow-sm border",
                          isUser
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-200 dark:border-blue-400 rounded-2xl rounded-tr-md"
                            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-md"
                        )}
                      >
                        <div className="leading-relaxed">
                          {isUser ? (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          ) : (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              {renderMessage(message.content)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div
                        className={cn(
                          "text-xs text-slate-500 dark:text-slate-400 px-1",
                          isUser ? "text-right" : "text-left"
                        )}
                      >
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Loading indicator */}
            {isLoading && !optimisticAssistantMsg && (
              <div className="flex justify-start">
                <div className="flex gap-4 max-w-[75%]">
                  <div className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-emerald-200 dark:border-emerald-400 text-white shadow-sm">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex space-x-1.5">
                        <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
                        <div 
                          className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.15s" }}
                        ></div>
                        <div 
                          className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.3s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-end gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:border-blue-500 dark:focus-within:border-blue-400 transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSubmit(e as unknown as React.FormEvent);
                  }
                }}
                rows={1}
                placeholder="Ask me about your career goals, job search, or professional development..."
                className="flex-1 resize-none bg-transparent px-3 py-2 text-sm placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none max-h-32 min-h-[2.5rem]"
                disabled={isLoading}
                maxLength={MESSAGE_CONSTANTS.MAX_CONTENT_LENGTH}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="h-8 w-8 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50" 
                disabled={!input.trim() || isLoading || input.length > MESSAGE_CONSTANTS.MAX_CONTENT_LENGTH}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Press Enter to send, Shift+Enter for new line
              </p>
              <div className={cn(
                "text-xs",
                input.length > MESSAGE_CONSTANTS.MAX_CONTENT_LENGTH 
                  ? "text-red-500 dark:text-red-400" 
                  : "text-slate-400 dark:text-slate-500"
              )}>
                {input.length}/{MESSAGE_CONSTANTS.MAX_CONTENT_LENGTH}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}