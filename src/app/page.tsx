"use client";

import { useQuotes } from "@/lib/quote-context";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { quotes, loading } = useQuotes();
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(new Date().toISOString().split("T")[0]);
  }, []);

  const outstanding = quotes.filter((q) => q.status !== "won" && q.status !== "lost");
  const totalValue = outstanding.reduce((sum, q) => sum + q.amount, 0);
  const awaiting = quotes.filter((q) => q.status === "awaiting").length;
  const dueToday = quotes.filter(
    (q) => q.nextFollowUp === today && q.status !== "won" && q.status !== "lost"
  ).length;
  const overdue = quotes.filter(
    (q) => q.nextFollowUp && q.nextFollowUp < today && q.status !== "won" && q.status !== "lost"
  ).length;

  const recent = [...quotes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your outstanding quotes</p>
        </div>
        <Link
          href="/quotes?new=1"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          +
          Add quote
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-sm text-gray-500 py-12">Loading your quotes…</div>
      ) : (
        <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Outstanding value"
          value={`$${totalValue.toLocaleString("en-CA")}`}
          icon={<span className="text-emerald-600 text-lg">$</span>}
          hint="Excludes won & lost"
        />
        <StatCard
          label="Awaiting response"
          value={awaiting.toString()}
          icon={<span className="text-amber-600">⏱</span>}
        />
        <StatCard
          label="Follow-ups due today"
          value={dueToday.toString()}
          icon={<span className="text-blue-600">📅</span>}
        />
        <StatCard
          label="Overdue follow-ups"
          value={overdue.toString()}
          icon={<span className="text-red-600">!</span>}
          highlight={overdue > 0}
        />
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-medium text-gray-900">Recently updated</h2>
        </div>
        <div className="divide-y">
          {recent.map((q) => (
            <div key={q.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <div className="font-medium text-gray-900">{q.customerName}</div>
                <div className="text-gray-500 truncate max-w-md">{q.jobDescription}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">${q.amount.toLocaleString("en-CA")}</div>
                <div className="text-xs text-gray-400">
                  {new Date(q.updatedAt).toLocaleDateString("en-CA")}
                </div>
              </div>
            </div>
          ))}
          {recent.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-500 text-sm">No quotes yet</div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm ${highlight ? "border-red-200" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
    </div>
  );
}
