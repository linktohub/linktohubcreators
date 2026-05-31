"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DeleteEventButton({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this event?")) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Event deleted");
    router.refresh();
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">
      {loading ? "..." : "Delete"}
    </button>
  );
}
