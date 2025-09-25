import "./globals.css";
import { Inter } from "next/font/google";
import Providers from "./providers";
import Navbar from "@/components/Navbar";

const inter = Inter({
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
    <html lang="en">
      <head>
        {/* no-FOIT: apply saved theme before React hydration to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var t = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var useDark = t ? t === 'dark' : prefersDark;
                  var root = document.documentElement;
                  if (useDark) root.classList.add('dark'); else root.classList.remove('dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`font-sans antialiased ${inter.variable}`}>
        <Providers>
          <Navbar />
          {/* spacer equal to header height to prevent overlap */}
          <div aria-hidden className="h-14" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
