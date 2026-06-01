import { Resend } from "resend";

const FROM = "Linktohub <orders@linktohub.com>";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === "your_resend_api_key") {
    console.warn("[email] RESEND_API_KEY not configured — skipping email");
    return null;
  }
  return new Resend(key);
}

export async function sendOrderConfirmation({
  to, buyerName, creatorName, items, totalCents, orderId, downloadUrls,
}: {
  to: string;
  buyerName: string;
  creatorName: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  totalCents: number;
  orderId: string;
  downloadUrls?: { title: string; url: string }[];
}) {
  const resend = getResend();
  if (!resend) return;

  const itemRows = items.map((i) =>
    `<tr><td style="padding:8px 0">${i.name} × ${i.quantity}</td><td style="padding:8px 0;text-align:right">$${((i.unitPrice * i.quantity) / 100).toFixed(2)}</td></tr>`
  ).join("");

  const downloadSection = downloadUrls?.length
    ? `<div style="margin:24px 0;padding:16px;background:#f9f9ff;border-radius:8px;border:1px solid #e0e0ff">
        <p style="font-weight:bold;margin:0 0 12px">📥 Your downloads are ready:</p>
        ${downloadUrls.map((d) => `<p style="margin:8px 0"><a href="${d.url}" style="color:#7c3aed;font-weight:bold">${d.title} — Download now →</a></p>`).join("")}
        <p style="color:#888;font-size:12px;margin:8px 0 0">Links expire in 72 hours and allow 5 downloads.</p>
      </div>`
    : "";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your order from ${creatorName} is confirmed!`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2 style="color:#7c3aed">Order confirmed 🎉</h2>
      <p>Thanks ${buyerName || "there"}, your order from <strong>${creatorName}</strong> is in.</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0">${itemRows}
        <tr style="border-top:1px solid #eee;font-weight:bold">
          <td style="padding:12px 0">Total</td>
          <td style="padding:12px 0;text-align:right">$${(totalCents / 100).toFixed(2)}</td>
        </tr>
      </table>
      ${downloadSection}
      <p style="color:#888;font-size:13px">Order ID: ${orderId}</p>
      <p style="color:#888;font-size:13px">Questions? Reply to this email.</p>
    </div>`,
  });
}

export async function sendNewSubscriberNotification({
  creatorEmail, creatorName, subscriberEmail,
}: {
  creatorEmail: string;
  creatorName: string;
  subscriberEmail: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to: creatorEmail,
    subject: `New subscriber on your Linktohub store!`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2>New subscriber 🎉</h2>
      <p><strong>${subscriberEmail}</strong> just joined your email list on <strong>${creatorName}</strong>'s storefront.</p>
    </div>`,
  });
}
