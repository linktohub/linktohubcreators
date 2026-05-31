"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function BookingActionButton({
  bookingId,
  status,
  meetingUrl,
}: {
  bookingId: string;
  status: string;
  meetingUrl?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function updateStatus(newStatus: string) {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("bookings").update({ status: newStatus }).eq("id", bookingId);
    if (error) toast.error(error.message);
    else { toast.success(`Booking ${newStatus}`); router.refresh(); }
    setLoading(false);
  }

  if (status === "pending") return (
    <div className="flex gap-1">
      <Button size="sm" onClick={() => updateStatus("confirmed")} disabled={loading} className="h-7 bg-green-500 hover:bg-green-400 text-white text-xs px-2">Confirm</Button>
      <Button size="sm" onClick={() => updateStatus("cancelled")} disabled={loading} variant="outline" className="h-7 border-red-400/30 text-red-400 hover:bg-red-400/10 text-xs px-2">Cancel</Button>
    </div>
  );

  if (status === "confirmed") return (
    <div className="flex gap-1">
      {meetingUrl && <a href={meetingUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" className="h-7 bg-white text-black text-xs px-2">Join</Button></a>}
      <Button size="sm" onClick={() => updateStatus("completed")} disabled={loading} variant="outline" className="h-7 border-white/20 text-white/60 text-xs px-2">Complete</Button>
    </div>
  );

  return null;
}
