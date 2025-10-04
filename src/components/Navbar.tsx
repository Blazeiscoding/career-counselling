"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LogIn, LogOut, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="flex-shrink-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 hover:opacity-90 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="hidden sm:inline">Career Counselor</span>
          </Link>
          {status === "authenticated" && (
            <Link 
              href="/chat" 
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-medium"
            >
              Chat
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {status === "authenticated" ? (
            <div className="flex items-center gap-3">
              {session?.user?.name && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {session.user.name}
                  </span>
                </div>
              )}
              
              <Button
                onClick={() => signOut({ callbackUrl: "/" })}
                variant="outline"
                size="sm"
                className="border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-700 hover:text-red-700 dark:hover:text-red-400 transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/signin">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-400 transition-all duration-200"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}