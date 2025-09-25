/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { LogIn, LogOut } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/" className="font-semibold hover:opacity-90">
            Career Counselor
          </Link>
          <Link href="/chat" className="opacity-80 hover:opacity-100">
            Chat
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {status === "authenticated" ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
