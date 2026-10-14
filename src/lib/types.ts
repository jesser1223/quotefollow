export type QuoteStatus = "awaiting" | "followup_needed" | "won" | "lost" | "follow_later";

export interface Quote {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  jobDescription: string;
  amount: number; // CAD
  dateSent: string; // ISO date
  nextFollowUp?: string; // ISO date
  notes?: string;
  status: QuoteStatus;
  updatedAt: string;
}

export const STATUS_LABELS: Record<QuoteStatus, string> = {
  awaiting: "Awaiting response",
  followup_needed: "Follow-up needed",
  won: "Won",
  lost: "Lost",
  follow_later: "Follow up later",
};

export const STATUS_COLORS: Record<QuoteStatus, string> = {
  awaiting: "bg-amber-100 text-amber-800",
  followup_needed: "bg-blue-100 text-blue-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-gray-100 text-gray-600",
  follow_later: "bg-purple-100 text-purple-800",
};
