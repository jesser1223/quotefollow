"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuotes } from "@/lib/quote-context";
import { Quote, QuoteStatus, STATUS_LABELS, STATUS_COLORS } from "@/lib/types";

export default function QuotesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading quotes…</div>}>
      <QuotesContent />
    </Suspense>
  );
}

function QuotesContent() {
  const { quotes, addQuote, updateQuote, deleteQuote } = useQuotes();
  const searchParams = useSearchParams();
  const showNew = searchParams.get("new") === "1";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [editing, setEditing] = useState<Quote | null>(null);
  const [viewing, setViewing] = useState<Quote | null>(null);
  const [showForm, setShowForm] = useState(showNew);

  const filtered = useMemo(() => {
    return quotes.filter((q) => {
      const matchSearch =
        q.customerName.toLowerCase().includes(search.toLowerCase()) ||
        q.jobDescription.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || q.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [quotes, search, statusFilter]);

  const handleSubmit = (data: Omit<Quote, "id" | "updatedAt">) => {
    if (editing) {
      updateQuote(editing.id, data);
      setEditing(null);
    } else {
      addQuote(data);
    }
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quotes</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all customer quotes</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Add quote
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search customer or job..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as QuoteStatus | "all")}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Sent</th>
                <th className="px-4 py-3">Next follow-up</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{q.customerName}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{q.jobDescription}</td>
                  <td className="px-4 py-3">${q.amount.toLocaleString("en-CA")}</td>
                  <td className="px-4 py-3 text-gray-500">{q.dateSent}</td>
                  <td className="px-4 py-3 text-gray-500">{q.nextFollowUp || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[q.status]}`}>
                      {STATUS_LABELS[q.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setViewing(q)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                        👁
                      </button>
                      <button onClick={() => { setEditing(q); setShowForm(true); }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                        ✎
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this quote?")) deleteQuote(q.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No quotes match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <QuoteModal
          quote={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSubmit={handleSubmit}
        />
      )}

      {viewing && (
        <ViewModal quote={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}

function QuoteModal({
  quote,
  onClose,
  onSubmit,
}: {
  quote: Quote | null;
  onClose: () => void;
  onSubmit: (data: Omit<Quote, "id" | "updatedAt">) => void;
}) {
  const [form, setForm] = useState({
    customerName: quote?.customerName || "",
    customerEmail: quote?.customerEmail || "",
    customerPhone: quote?.customerPhone || "",
    jobDescription: quote?.jobDescription || "",
    amount: quote?.amount?.toString() || "",
    dateSent: quote?.dateSent || new Date().toISOString().split("T")[0],
    nextFollowUp: quote?.nextFollowUp || "",
    notes: quote?.notes || "",
    status: quote?.status || "awaiting" as QuoteStatus,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = "Customer name is required";
    if (!form.jobDescription.trim()) e.jobDescription = "Job description is required";
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt < 0) e.amount = "Enter a valid non-negative amount";
    return e;
  };

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSubmit({
      customerName: form.customerName.trim(),
      customerEmail: form.customerEmail.trim() || undefined,
      customerPhone: form.customerPhone.trim() || undefined,
      jobDescription: form.jobDescription.trim(),
      amount: parseFloat(form.amount),
      dateSent: form.dateSent,
      nextFollowUp: form.nextFollowUp || undefined,
      notes: form.notes.trim() || undefined,
      status: form.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">{quote ? "Edit quote" : "Add quote"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        <form onSubmit={handle} className="space-y-4 p-5">
          <Field label="Customer name" required error={errors.customerName}>
            <input
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="input"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Phone">
              <input
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                className="input"
              />
            </Field>
          </div>
          <Field label="Job description" required error={errors.jobDescription}>
            <textarea
              rows={3}
              value={form.jobDescription}
              onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
              className="input"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount (CAD)" required error={errors.amount}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as QuoteStatus })}
                className="input"
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date sent">
              <input
                type="date"
                value={form.dateSent}
                onChange={(e) => setForm({ ...form, dateSent: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Next follow-up">
              <input
                type="date"
                value={form.nextFollowUp}
                onChange={(e) => setForm({ ...form, nextFollowUp: e.target.value })}
                className="input"
              />
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input"
            />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              {quote ? "Save changes" : "Add quote"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  error,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}

function ViewModal({ quote, onClose }: { quote: Quote; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">{quote.customerName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        <div className="space-y-3 p-5 text-sm">
          <div><span className="text-gray-500">Job:</span> {quote.jobDescription}</div>
          <div><span className="text-gray-500">Amount:</span> ${quote.amount.toLocaleString("en-CA")} CAD</div>
          <div><span className="text-gray-500">Status:</span> {STATUS_LABELS[quote.status]}</div>
          <div><span className="text-gray-500">Sent:</span> {quote.dateSent}</div>
          {quote.nextFollowUp && <div><span className="text-gray-500">Next follow-up:</span> {quote.nextFollowUp}</div>}
          {quote.customerEmail && <div><span className="text-gray-500">Email:</span> {quote.customerEmail}</div>}
          {quote.customerPhone && <div><span className="text-gray-500">Phone:</span> {quote.customerPhone}</div>}
          {quote.notes && <div><span className="text-gray-500">Notes:</span> {quote.notes}</div>}
        </div>
      </div>
    </div>
  );
}
