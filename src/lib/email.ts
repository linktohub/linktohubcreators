import { Resend } from "resend";

const FROM = "Linktohub <orders@linktohub.com>";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === "your_resend_api_key") throw new Error("RESEND_API_KEY not configured");
  return new Resend(key);
}

export async function sendOrderConfirmation({
  to, buyerName, creatorName, items, totalCents, orderId,
}: {
  to: string;
  buyerName: string;
  creatorName: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  totalCents: number;
  orderId: string;
}) {
  const resend = getResend();
  const itemRows = items.map((i) =>
    `<tr><td style="padding:8px 0">${i.name} × ${i.quantity}</td><td style="padding:8px 0;text-align:right">$${((i.unitPrice * i.quantity) / 100).toFixed(2)}</td></tr>`
  ).join("");

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your order from ${creatorName} is confirmed!`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2>Order confirmed 🎉</h2>
      <p>Thanks ${buyerName}, your order from <strong>${creatorName}</strong> is in.</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0">${itemRows}
        <tr style="border-top:1px solid #eee;font-weight:bold">
          <td style="padding:12px 0">Total</td>
          <td style="padding:12px 0;text-align:right">$${(totalCents / 100).toFixed(2)}</td>
        </tr>
      </table>
      <p style="color:#888;font-size:13px">Order ID: ${orderId}</p>
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
  await resend.emails.send({
    from: FROM,
    to: creatorEmail,
    subject: `New subscriber on Linktohub!`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2>New subscriber 🎉</h2>
      <p><strong>${subscriberEmail}</strong> just subscribed on your Linktohub storefront.</p>
    </div>`,
  });
}
