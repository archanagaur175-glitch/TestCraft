"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isExam = pathname.startsWith("/exam");

  return (
    <div className="app-bg flex min-h-screen flex-col">
      <Navbar />
      <main
        className={isExam ? "flex-1 pb-10" : "mx-auto w-full max-w-6xl flex-1 px-4 pb-10"}
      >
        {children}
      </main>
      {!isExam && <Footer />}
    </div>
  );
}