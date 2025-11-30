/* eslint-disable @next/next/no-sync-scripts */
import "./globals.css";
import { Outfit } from "next/font/google";
import Providers from "./providers";
import Navbar from "@/components/Navbar";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Career Counselor - AI-Powered Career Guidance",
  description:
    "Get personalized career advice and guidance from our AI counselor",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`font-sans antialiased ${outfit.variable}`}
        suppressHydrationWarning
      >
        <Providers>
          <div className="flex flex-col h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />

            <main className="flex-1 overflow-hidden relative">{children}</main>
          </div>
        </Providers>
        <script
          src="https://feedback-pulse.vercel.app/widget.js"
          data-project="proj_O44xAKb2i6"
        ></script>
      </body>
    </html>
  );
}
