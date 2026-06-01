import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function authCheck(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const key = auth?.replace("Bearer ", "");
  return key === process.env.SUPABASE_SERVICE_ROLE_KEY || key === process.env.AGENT_API_KEY;
}

// GET — agents read shared memory before doing their job
export async function GET(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const agent = searchParams.get("agent");
  const limit = parseInt(searchParams.get("limit") || "100");
  const actionNeeded = searchParams.get("action_needed") === "true";

  let query = admin
    .from("agent_memory")
    .select("*")
    .gt("expires_at", new Date().toISOString())
    .order("importance", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category && category !== "all") query = query.eq("category", category);
  if (actionNeeded) query = query.eq("requires_action", true).eq("action_taken", false);
  if (agent) query = query.or(`target_agents.cs.{${agent}},target_agents.is.null`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also get recent metrics
  const { data: metrics } = await admin
    .from("business_metrics")
    .select("*")
    .order("date", { ascending: false })
    .limit(30);

  // Get recent agent logs for context
  const { data: logs } = await admin
    .from("agent_logs")
    .select("agent, run_at, summary, next_focus")
    .order("run_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ memories: data || [], metrics: metrics || [], recent_agent_activity: logs || [] });
}

// POST — agents write findings after completing their work
export async function POST(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === "write_memory") {
    const { agent, category, key, value, data, importance, target_agents, requires_action, expires_days } = body;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expires_days || 30));

    const { error } = await admin.from("agent_memory").insert({
      agent,
      category,
      key,
      value,
      data: data || {},
      importance: importance || 5,
      target_agents: target_agents || null,
      requires_action: requires_action || false,
      expires_at: expiresAt.toISOString(),
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "write_metric") {
    const { date, metric, value, unit, notes, agent } = body;
    const { error } = await admin.from("business_metrics").upsert(
      { date: date || new Date().toISOString().split("T")[0], metric, value, unit, notes, agent },
      { onConflict: "date,metric" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "log_run") {
    const { agent, summary, memories_read, memories_written, actions_taken, escalations, next_focus } = body;
    await admin.from("agent_logs").insert({ agent, summary, memories_read, memories_written, actions_taken, escalations, next_focus });
    return NextResponse.json({ ok: true });
  }

  if (action === "mark_action_taken") {
    const { memory_id } = body;
    await admin.from("agent_memory").update({ action_taken: true }).eq("id", memory_id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
