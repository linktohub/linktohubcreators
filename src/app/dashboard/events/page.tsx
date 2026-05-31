import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import DeleteEventButton from "./delete-button";

const EVENT_TYPE_EMOJI: Record<string, string> = {
  webinar: "💻",
  zoom: "🎥",
  seminar: "🎤",
  livestream: "🔴",
  in_person: "📍",
};

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
  if (!creator) redirect("/onboarding");

  const { data: events } = await supabase
    .from("events")
    .select("*, event_registrations(count)")
    .eq("creator_id", creator.id)
    .order("starts_at");

  const upcoming = (events || []).filter((e) => new Date(e.starts_at) >= new Date());
  const past = (events || []).filter((e) => new Date(e.starts_at) < new Date());

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-black">Events</h1>
            <p className="text-white/40 mt-1">Webinars, seminars, Zoom sessions</p>
          </div>
        </div>
        <Link href="/dashboard/events/new">
          <Button className="bg-white text-black hover:bg-white/90 font-bold gap-2">
            <Plus className="w-4 h-4" /> New Event
          </Button>
        </Link>
      </div>

      {events && events.length > 0 ? (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-3 text-white/70">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="w-14 h-14 rounded-xl bg-white/10 flex flex-col items-center justify-center shrink-0">
                      <p className="text-xs text-white/40">{format(new Date(event.starts_at), "MMM")}</p>
                      <p className="text-xl font-black">{format(new Date(event.starts_at), "d")}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{event.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs border-white/20 text-white/50">
                          {EVENT_TYPE_EMOJI[event.type]} {event.type}
                        </Badge>
                        <Badge variant="outline" className={`text-xs border-white/20 ${event.published ? "text-green-400 border-green-400/30" : "text-white/40"}`}>
                          {event.published ? "Live" : "Draft"}
                        </Badge>
                        <span className="text-white/30 text-xs">{event.event_registrations?.[0]?.count || 0} registered</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold">{event.price === 0 ? "Free" : `$${event.price}`}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Link href={`/dashboard/events/${event.id}/edit`}>
                          <button className="text-xs text-white/40 hover:text-white transition-colors">Edit</button>
                        </Link>
                        <DeleteEventButton eventId={event.id} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-3 text-white/50">Past</h2>
              <div className="space-y-3 opacity-60">
                {past.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{event.title}</p>
                      <p className="text-white/40 text-sm">{format(new Date(event.starts_at), "MMM d, yyyy")}</p>
                    </div>
                    <span className="text-white/30 text-xs">{event.event_registrations?.[0]?.count || 0} attended</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 border border-white/10 rounded-2xl">
          <Ticket className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg font-semibold mb-2">No events yet</p>
          <p className="text-white/30 text-sm mb-6">Host webinars, seminars, and Zoom sessions for your audience</p>
          <Link href="/dashboard/events/new">
            <Button className="bg-white text-black hover:bg-white/90 font-bold">Create first event</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
