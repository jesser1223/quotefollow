import { Quote } from "./types";

export type Priority = "high" | "medium" | "low";

export interface PrioritizedQuote {
  quote: Quote;
  priority: Priority;
  reason: string;
  daysSinceSent: number;
  daysUntilFollowUp: number | null;
}

function daysBetween(from: string, to: Date = new Date()): number {
  const a = new Date(from);
  return Math.floor((to.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function prioritizeQuotes(quotes: Quote[]): PrioritizedQuote[] {
  const today = new Date();
  const active = quotes.filter((q) => q.status !== "won" && q.status !== "lost");

  const prioritized: PrioritizedQuote[] = active.map((quote) => {
    const daysSinceSent = daysBetween(quote.dateSent, today);
    const daysUntilFollowUp = quote.nextFollowUp
      ? daysBetween(quote.nextFollowUp, today) * -1
      : null;

    let priority: Priority = "low";
    let reason = "No immediate follow-up needed.";

    if (daysUntilFollowUp !== null && daysUntilFollowUp < 0) {
      priority = "high";
      reason = `Follow-up is ${Math.abs(daysUntilFollowUp)} day(s) overdue.`;
    } else if (daysUntilFollowUp === 0) {
      priority = "high";
      reason = "Follow-up is due today.";
    } else if (quote.status === "followup_needed") {
      priority = "high";
      reason = "Marked as needing follow-up.";
    } else if (daysSinceSent >= 5 && quote.status === "awaiting") {
      priority = "medium";
      reason = `Sent ${daysSinceSent} days ago with no response yet.`;
    } else if (daysUntilFollowUp !== null && daysUntilFollowUp <= 2) {
      priority = "medium";
      reason = `Follow-up due in ${daysUntilFollowUp} day(s).`;
    }

    return { quote, priority, reason, daysSinceSent, daysUntilFollowUp };
  });

  const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
  return prioritized.sort((a, b) => order[a.priority] - order[b.priority]);
}