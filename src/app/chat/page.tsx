"use client";

import { useState } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { MessageCircle, Sparkles, TrendingUp, Users, Award } from "lucide-react";

export default function ChatPage() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <ChatSidebar
        currentSessionId={currentSessionId || undefined}
        onSessionSelect={setCurrentSessionId}
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        {currentSessionId ? (
          <ChatInterface sessionId={currentSessionId} />
        ) : (
          <div className="flex items-center justify-center h-full overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <div className="text-center max-w-2xl px-6">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-3xl shadow-2xl">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4 tracking-tight">
                  Your AI Career Guide
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                  Get personalized career advice, resume reviews, interview prep, and professional development guidance
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-center justify-center w-12 h-12 mb-4 bg-gradient-to-br from-green-400 to-green-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Career Planning</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Discover career paths that align with your skills, interests, and goals
                  </p>
                </div>

                <div className="group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-center justify-center w-12 h-12 mb-4 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Interview Prep</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Practice interviews and get tips to confidently showcase your abilities
                  </p>
                </div>

                <div className="group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-center justify-center w-12 h-12 mb-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Skill Development</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Identify skills to learn and resources to advance your career
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-8 border border-blue-200/50 dark:border-blue-800/50">
                <MessageCircle className="h-8 w-8 text-blue-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Ready to start your journey?
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  Select an existing conversation from the sidebar or create a new chat to begin exploring your career possibilities with personalized AI guidance.
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-sm">
                  <span className="px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-600">
                    Career Transitions
                  </span>
                  <span className="px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-600">
                    Resume Reviews
                  </span>
                  <span className="px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-600">
                    Salary Negotiation
                  </span>
                  <span className="px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-600">
                    Industry Insights
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}