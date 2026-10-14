"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { Quote, QuoteStatus } from "./types";
import type { User } from "@supabase/supabase-js";

interface QuoteContextType {
  quotes: Quote[];
  loading: boolean;
  user: User | null;
  addQuote: (quote: Omit<Quote, "id" | "updatedAt">) => Promise<void>;
  updateQuote: (id: string, updates: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

function mapRow(row: any): Quote {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email || undefined,
    customerPhone: row.customer_phone || undefined,
    jobDescription: row.job_description,
    amount: Number(row.amount),
    dateSent: row.date_sent,
    nextFollowUp: row.next_follow_up || undefined,
    notes: row.notes || undefined,
    status: row.status as QuoteStatus,
    updatedAt: row.updated_at,
  };
}

export function QuoteProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const refresh = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
    if (!currentUser) {
      setQuotes([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) {
      setQuotes(data.map(mapRow));
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => subscription.unsubscribe();
  }, []);

  const addQuote = async (data: Omit<Quote, "id" | "updatedAt">) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;
    const { error } = await supabase.from("quotes").insert({
      user_id: currentUser.id,
      customer_name: data.customerName,
      customer_email: data.customerEmail || null,
      customer_phone: data.customerPhone || null,
      job_description: data.jobDescription,
      amount: data.amount,
      date_sent: data.dateSent,
      next_follow_up: data.nextFollowUp || null,
      notes: data.notes || null,
      status: data.status,
    });
    if (!error) await refresh();
  };

  const updateQuote = async (id: string, updates: Partial<Quote>) => {
    const payload: any = {};
    if (updates.customerName !== undefined) payload.customer_name = updates.customerName;
    if (updates.customerEmail !== undefined) payload.customer_email = updates.customerEmail || null;
    if (updates.customerPhone !== undefined) payload.customer_phone = updates.customerPhone || null;
    if (updates.jobDescription !== undefined) payload.job_description = updates.jobDescription;
    if (updates.amount !== undefined) payload.amount = updates.amount;
    if (updates.dateSent !== undefined) payload.date_sent = updates.dateSent;
    if (updates.nextFollowUp !== undefined) payload.next_follow_up = updates.nextFollowUp || null;
    if (updates.notes !== undefined) payload.notes = updates.notes || null;
    if (updates.status !== undefined) payload.status = updates.status;
    payload.updated_at = new Date().toISOString();

    const { error } = await supabase.from("quotes").update(payload).eq("id", id);
    if (!error) await refresh();
  };

  const deleteQuote = async (id: string) => {
    const { error } = await supabase.from("quotes").delete().eq("id", id);
    if (!error) await refresh();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setQuotes([]);
  };

  return (
    <QuoteContext.Provider
      value={{ quotes, loading, user, addQuote, updateQuote, deleteQuote, refresh, signOut }}
    >
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuotes() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuotes must be used within QuoteProvider");
  return ctx;
}
