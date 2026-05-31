export async function track(creatorId: string, eventType: string, metadata?: Record<string, unknown>) {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorId, eventType, metadata }),
    });
  } catch {
    // Silent — never break the page for analytics
  }
}
