import { Resend } from "resend";

export function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === "your_resend_api_key") return null;
  return new Resend(key);
}
