import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TestCraft — Custom Test Generator",
    template: "%s · TestCraft",
  },
  description:
    "TestCraft is a stunning custom test generator for students across CBSE, ICSE, JEE, NEET, SAT and university curricula — adaptive difficulty, AI per-question tutoring, readiness prediction and crisp PDF export.",
  keywords: [
    "test generator",
    "CBSE",
    "ICSE",
    "JEE",
    "NEET",
    "SAT",
    "practice tests",
    "adaptive learning",
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}