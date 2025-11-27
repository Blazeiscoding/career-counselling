"use client";

import { type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { TRPCReactProvider } from "@/trpc/react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <TRPCReactProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </TRPCReactProvider>
    </SessionProvider>
  );
}

