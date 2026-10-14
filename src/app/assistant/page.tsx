"use client";

import { useState } from "react";
import { useQuotes } from "@/lib/quote-context";
import { prioritizeQuotes, PrioritizedQuote } from "@/lib/followup-engine";
import { STATUS_LABELS } from "@/lib/types";

interface AssistantResult {
  action: string;
  reason: string;
  priority: string;
  message_subject: string;
  message_body: string;
  suggested_follow_up_date: string | null;
  requires_owner_review: boolean;
  source: string;
}

export default function AssistantPage() {
  const { quotes, loading, updateQuote } = useQuotes();
  const prioritized = prioritizeQuotes(quotes).filter((p) => p.priority !== "low");
  const [selected, setSelected] = useState<PrioritizedQuote | null>(null);
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [draft, setDraft] = useState("");
  const [subject, setSubject] = useState("");
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState("");

  const generate = async (item: PrioritizedQuote) => {
    setSelected(item);
    setResult(null);
    setGenerating(true);
    setStatus("");
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: item.quote.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setDraft(data.message_body || "");
      setSubject(data.message_subject || "");
    } catch (err: any) {
      setStatus(err.message || "Failed to generate");
    }
    setGenerating(false);
  };

  const approve = async () => {
    if (!selected || !result) return;
    setStatus("Saving…");
    await updateQuote(selected.quote.id, {
      notes: (selected.quote.notes ? selected.quote.notes + "\n\n" : "") +
        `[Approved draft ${new Date().toISOString().slice(0, 10)}]\nSubject: ${subject}\n${draft}`,
      nextFollowUp: result.suggested_follow_up_date || selected.quote.nextFollowUp,
    });
    setStatus("Draft approved and saved to the quote notes. Message was not sent.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">AI Follow-up Assistant</h1>
        <p className="text-sm text-gray-500 mt-1">
          Reviews outstanding quotes, recommends the next action, and drafts a message for your approval.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading quotes…</div>
      ) : prioritized.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
          No quotes currently need attention.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-gray-700">Quotes needing attention</h2>
            {prioritized.map((item) => (
              <button
                key={item.quote.id}
                onClick={() => generate(item)}
                className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm hover:border-emerald-300 ${
                  selected?.quote.id === item.quote.id ? "border-emerald-500 ring-1 ring-emerald-500" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{item.quote.customerName}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-600 truncate">{item.quote.jobDescription}</div>
                <div className="mt-1 text-xs text-gray-500">
                  ${item.quote.amount.toLocaleString("en-CA")} · {STATUS_LABELS[item.quote.status]} · {item.reason}
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            {!selected && (
              <div className="text-sm text-gray-500">Select a quote to generate a recommendation and draft.</div>
            )}
            {generating && <div className="text-sm text-gray-500">Generating…</div>}
            {result && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-medium uppercase text-gray-500">Recommendation</div>
                  <div className="mt-1 font-medium text-gray-900">{result.reason}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    Action: {result.action.replace(/_/g, " ")} · Priority: {result.priority}
                    {result.source !== "ai" && ` · (${result.source})`}
                  </div>
                </div>

                {result.message_body && (
                  <>
                    <div>
                      <label className="text-xs font-medium uppercase text-gray-500">Subject</label>
                      <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase text-gray-500">Message draft</label>
                      <textarea
                        rows={8}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={approve}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                      >
                        Approve & save
                      </button>
                      <button
                        onClick={() => { setResult(null); setSelected(null); }}
                        className="rounded-lg border px-4 py-2 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </>
                )}
                {status && <div className="text-sm text-emerald-700">{status}</div>}
                <div className="text-xs text-gray-400">
                  Messages are never sent automatically. Approval only saves the draft to the quote notes.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
