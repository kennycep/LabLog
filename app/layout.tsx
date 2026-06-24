import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { AppGate } from "@/components/AppGate";

export const metadata: Metadata = {
  title: "LabLog — Research Command Center",
  description:
    "A personal research work tracker: daily logs, goals, tasks, blockers, and weekly updates for your PI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set theme before paint to avoid a flash of the wrong mode. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('lablog:theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            <AppGate>{children}</AppGate>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
