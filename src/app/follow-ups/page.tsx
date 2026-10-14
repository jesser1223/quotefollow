"use client";

import { useQuotes } from "@/lib/quote-context";
import { Quote, QuoteStatus, STATUS_LABELS } from "@/lib/types";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function FollowUpsPage() {
  const { quotes, updateQuote } = useQuotes();
  const [today, setToday] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newStatus, setNewStatus] = useState<QuoteStatus>("awaiting");

  useEffect(() => {
    setToday(new Date().toISOString().split("T")[0]);
  }, []);

  const active = quotes.filter((q) => q.status !== "won" && q.status !== "lost");

  const overdue = active.filter((q) => q.nextFollowUp && q.nextFollowUp < today);
  const dueToday = active.filter((q) => q.nextFollowUp === today);
  const upcoming = active.filter((q) => q.nextFollowUp && q.nextFollowUp > today);

  const startEdit = (q: Quote) => {
    setEditing(q.id);
    setNewDate(q.nextFollowUp || today);
    setNewStatus(q.status);
  };

  const save = (id: string) => {
    updateQuote(id, { nextFollowUp: newDate || undefined, status: newStatus });
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Follow-ups</h1>
        <p className="text-sm text-gray-500 mt-1">Quotes that need attention, ordered by urgency</p>
      </div>

      <Section title="Overdue" items={overdue} icon={<span className="text-red-600">!</span>} empty="No overdue follow-ups" />
      <Section title="Due today" items={dueToday} icon={<span className="text-blue-600">📅</span>} empty="Nothing due today" />
      <Section title="Upcoming" items={upcoming} icon={<span className="text-gray-500">⏱</span>} empty="No upcoming follow-ups" />

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl space-y-4">
            <h3 className="font-semibold">Update follow-up</h3>
            <label className="block text-sm">
              Next follow-up date
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="input mt-1"
              />
            </label>
            <label className="block text-sm">
              Status
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as QuoteStatus)}
                className="input mt-1"
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="rounded-lg border px-3 py-1.5 text-sm">
                Cancel
              </button>
              <button onClick={() => save(editing)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function Section({ title, items, icon, empty }: { title: string; items: Quote[]; icon: React.ReactNode; empty: string }) {
    return (
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b px-5 py-3">
          {icon}
          <h2 className="font-medium">{title}</h2>
          <span className="ml-auto text-xs text-gray-400">{items.length}</span>
        </div>
        <div className="divide-y">
          {items.map((q) => (
            <div key={q.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <Link href="/quotes" className="font-medium text-gray-900 hover:text-emerald-600">
                  {q.customerName}
                </Link>
                <div className="text-gray-500 truncate">{q.jobDescription}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  ${q.amount.toLocaleString("en-CA")} · {STATUS_LABELS[q.status]}
                  {q.nextFollowUp && ` · Due ${q.nextFollowUp}`}
                </div>
              </div>
              <button
                onClick={() => startEdit(q)}
                className="ml-4 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
              >
                Update
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="px-5 py-6 text-center text-sm text-gray-500">{empty}</div>
          )}
        </div>
      </div>
    );
  }
}
