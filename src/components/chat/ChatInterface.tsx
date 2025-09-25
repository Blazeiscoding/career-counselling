/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Send, User, Bot } from "lucide-react";
import { cn } from "@/utils/cn";

interface ChatInterfaceProps {
  sessionId: string;
}

export function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const suggestedPrompts = [
    "Help me choose a career path",
    "Review my resume for a software role",
    "How do I switch from sales to product management?",
    "Prep me for a data analyst interview",
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

  // Minimal, safe Markdown renderer (bold, italics, inline code, links, line breaks)
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
          <a key={`lnk-${i}`} href={url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:opacity-90">{label}</a>
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
          result.push(<code key={`code-${idxBase}-${i}`} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{code}</code>);
        } else {
          // Bold **text** inside this plain segment
          const boldSplit = seg.split(/(\*\*[^*]+\*\*)/g);
          boldSplit.forEach((bseg, j) => {
            if (bseg.startsWith("**") && bseg.endsWith("**")) {
              result.push(<strong key={`b-${idxBase}-${i}-${j}`}>{bseg.slice(2, -2)}</strong>);
            } else {
              // Italic *text*
              const italSplit = bseg.split(/(\*[^*]+\*)/g);
              italSplit.forEach((iseg, k) => {
                if (iseg.startsWith("*") && iseg.endsWith("*")) {
                  result.push(<em key={`i-${idxBase}-${i}-${j}-${k}`}>{iseg.slice(1, -1)}</em>);
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
    // Only auto-scroll when there are messages (or optimistic ones).
    // When there are no messages, we want the greeting and suggested prompts to be visible at the top.
    if (visibleMessages.length > 0 || optimisticUserMsg || optimisticAssistantMsg) {
      scrollToBottom();
    }
  }, [visibleMessages, optimisticUserMsg, optimisticAssistantMsg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const content = input.trim();
    setIsLoading(true);
    // Optimistically render user and assistant placeholder
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

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Streaming request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      // Read and append chunks into the optimistic assistant bubble
      // until stream finishes
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setOptimisticAssistantMsg((prev) =>
          prev ? { ...prev, content: prev.content + chunk } : prev
        );
      }
    } catch (error) {
      console.error("Failed to stream response:", error);
    } finally {
      setIsLoading(false);
      // Clear optimistic messages and sync from server
      setOptimisticUserMsg(null);
      setOptimisticAssistantMsg(null);
      void refetch();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Messages */}
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto bg-background">
        {visibleMessages.length === 0 ? (
          <div className="p-4 md:p-6">
            <div className="flex flex-col items-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full border bg-muted text-muted-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-muted shadow-sm">
                  <div className="text-sm leading-relaxed">
                    {renderMessage(
                      "Hi! I'm your AI career counselor. What can I help you with today?"
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestedPrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setInput(p)}
                    className="text-xs md:text-sm px-3 py-1.5 rounded-full border bg-background hover:bg-muted transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 md:p-6 space-y-3">
            {visibleMessages.map((message, idx) => {
              const prev = visibleMessages[idx - 1];
              const next = visibleMessages[idx + 1];
              const isUser = message.role === "USER";
              const isGroupStart = !prev || prev.role !== message.role;
              const isGroupEnd = !next || next.role !== message.role;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2 md:gap-3",
                    isUser ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "flex max-w-[80%] items-end",
                      isUser ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar only at group start */}
                    {isGroupStart ? (
                      <div
                        className={cn(
                          "flex h-8 w-8 md:h-9 md:w-9 shrink-0 select-none items-center justify-center rounded-full border shadow-sm",
                          isUser
                            ? "bg-blue-500 text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isUser ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                    ) : (
                      <div className="w-8 md:w-9" />
                    )}

                    <div className={cn("ml-2 mr-2 space-y-1")}
                    >
                      <div
                        className={cn(
                          "px-3 py-2 text-sm shadow-sm",
                          isUser
                            ? "bg-blue-500 text-white"
                            : "bg-muted",
                          // Bubble shape: sharper corner towards the speaker
                          isUser
                            ? isGroupStart
                              ? "rounded-2xl rounded-tr-sm"
                              : "rounded-2xl"
                            : isGroupStart
                            ? "rounded-2xl rounded-tl-sm"
                            : "rounded-2xl"
                        )}
                      >
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {isUser ? (
                            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          ) : (
                            <div className="leading-relaxed">{renderMessage(message.content)}</div>
                          )}
                        </div>
                      </div>

                      {/* Timestamp at end of group */}
                      {isGroupEnd ? (
                        <div
                          className={cn(
                            "text-[10px] md:text-xs opacity-60",
                            isUser ? "text-right" : "text-left"
                          )}
                        >
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
            {isLoading && !optimisticAssistantMsg && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border shadow bg-muted">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg px-3 py-2 bg-muted">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* End of messages */}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3 md:p-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            rows={1}
            placeholder="Ask me about your career... (Shift+Enter for newline)"
            className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 max-h-40"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" className="h-10 w-10" disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
