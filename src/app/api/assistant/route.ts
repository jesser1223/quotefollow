import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are QuoteFollow's AI follow-up assistant for small service businesses, initially focusing on landscaping and property maintenance.

Primary objective: Help business owners follow up on outstanding quotes consistently, communicate professionally, and improve their chances of winning work.

Responsibilities:
1. Review the quote information and available contact history provided by the application.
2. Recommend whether the business should follow up now, wait, request clarification, revise a quote, or take no action.
3. Explain each recommendation in one concise sentence.
4. Draft a personalized, friendly, professional email or text message using only verified information provided by the application.
5. Keep the business owner's preferred tone and communication channel in mind.
6. Avoid repeatedly contacting customers who have declined, accepted, opted out, or requested no further contact.

Rules:
- Never invent customer conversations, prices, discounts, availability, or job details.
- Never change a quote's price, status, expiry date, or terms without explicit authorization.
- Never claim that a message was sent unless the application confirms it.
- Never send a message without the required business approval.
- Do not treat an AI-generated recommendation as a confirmed customer response.
- Do not recommend follow-ups when a quote is closed or the customer has opted out.
- If important information is missing, ask the business owner rather than guessing.
- Respect applicable privacy, electronic messaging, and anti-spam requirements.

Output must be valid JSON with exactly these fields:
{
  "action": "follow_up_now | wait | request_clarification | revise_quote | no_action",
  "reason": "one concise sentence",
  "priority": "high | medium | low",
  "message_subject": "email subject or empty string",
  "message_body": "the proposed message body",
  "suggested_follow_up_date": "YYYY-MM-DD or null",
  "requires_owner_review": true
}`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { quoteId } = await request.json();
  if (!quoteId) {
    return NextResponse.json({ error: "quoteId required" }, { status: 400 });
  }

  const { data: quote, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .eq("user_id", user.id)
    .single();

  if (error || !quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (quote.status === "won" || quote.status === "lost") {
    return NextResponse.json({
      action: "no_action",
      reason: "Quote is already closed.",
      priority: "low",
      message_subject: "",
      message_body: "",
      suggested_follow_up_date: null,
      requires_owner_review: false,
      source: "rules",
    });
  }

  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL || "https://api.x.ai/v1/chat/completions";
  const model = process.env.AI_MODEL || "grok-3";

  const userMessage = `Quote data (use only this information):
- Quote ID: ${quote.id}
- Customer name: ${quote.customer_name}
- Email: ${quote.customer_email || "not provided"}
- Phone: ${quote.customer_phone || "not provided"}
- Job description: ${quote.job_description}
- Amount: $${Number(quote.amount).toLocaleString("en-CA")} CAD
- Date sent: ${quote.date_sent}
- Next follow-up: ${quote.next_follow_up || "not set"}
- Status: ${quote.status}
- Notes: ${quote.notes || "none"}
- Previous messages: none recorded yet`;

  if (!apiKey) {
    const firstName = quote.customer_name.split(" ")[0];
    return NextResponse.json({
      action: "follow_up_now",
      reason: `Follow up with ${quote.customer_name} about the outstanding quote.`,
      priority: quote.status === "followup_needed" ? "high" : "medium",
      message_subject: `Following up on your ${quote.job_description.slice(0, 40)} quote`,
      message_body: `Hi ${firstName},\n\nJust following up on the quote I sent for ${quote.job_description}. The total was $${Number(quote.amount).toLocaleString("en-CA")} CAD.\n\nLet me know if you have any questions or would like to move forward.\n\nThanks!`,
      suggested_follow_up_date: quote.next_follow_up || null,
      requires_owner_review: true,
      source: "template",
    });
  }

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.6,
      }),
    });

    if (!res.ok) throw new Error(`AI API ${res.status}`);

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (parsed?.action && parsed?.reason && parsed?.message_body) {
      return NextResponse.json({ ...parsed, source: "ai" });
    }
    throw new Error("Bad AI response");
  } catch {
    const firstName = quote.customer_name.split(" ")[0];
    return NextResponse.json({
      action: "follow_up_now",
      reason: `Follow up with ${quote.customer_name}.`,
      priority: "medium",
      message_subject: "Following up on your quote",
      message_body: `Hi ${firstName},\n\nJust checking in on the quote for ${quote.job_description} ($${Number(quote.amount).toLocaleString("en-CA")} CAD).\n\nHappy to answer any questions.\n\nThanks!`,
      suggested_follow_up_date: quote.next_follow_up || null,
      requires_owner_review: true,
      source: "fallback",
    });
  }
}
