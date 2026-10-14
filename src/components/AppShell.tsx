"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { QuoteProvider } from "@/lib/quote-context";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <QuoteProvider>
      {isLogin ? (
        children
      ) : (
        <div className="flex h-full">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      )}
    </QuoteProvider>
  );
}
