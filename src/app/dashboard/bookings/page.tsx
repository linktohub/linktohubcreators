import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import BookingActionButton from "./action-button";

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400",
  confirmed: "text-green-400",
  completed: "text-white/40",
  cancelled: "text-red-400",
};

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: creator } = await supabase.from("creators").select("id, calendar_enabled").eq("user_id", user.id).single();
  if (!creator) redirect("/onboarding");

  const [{ data: bookings }, { data: bookingProducts }] = await Promise.all([
    supabase.from("bookings").select("*, profiles(full_name, email, avatar_url)").eq("creator_id", creator.id).order("scheduled_at"),
    supabase.from("products").select("id").eq("creator_id", creator.id).eq("type", "booking").eq("active", true),
  ]);

  const upcoming = (bookings || []).filter((b) => b.status !== "completed" && b.status !== "cancelled");
  const past = (bookings || []).filter((b) => b.status === "completed" || b.status === "cancelled");

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-black">Bookings</h1>
            <p className="text-white/40 mt-1">1-on-1 sessions with your audience</p>
          </div>
        </div>
        {!creator.calendar_enabled && (
          <Badge variant="outline" className="border-yellow-400/30 text-yellow-400">
            Calendar disabled in settings
          </Badge>
        )}
      </div>

      {creator.calendar_enabled && (!bookingProducts || bookingProducts.length === 0) && (
        <div className="mb-6 flex items-center gap-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
          <span className="text-yellow-400 text-xl shrink-0">📅</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-yellow-400">No booking products yet</p>
            <p className="text-white/40 text-xs mt-0.5">Add a 1-on-1 session product so fans can request bookings from your storefront.</p>
          </div>
          <Link href="/dashboard/products/create"
            className="shrink-0 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 font-bold text-xs px-3 py-2 rounded-xl transition-colors">
            Add product
          </Link>
        </div>
      )}

      {bookings && bookings.length > 0 ? (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-3 text-white/70">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map((booking) => (
                  <div key={booking.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-center shrink-0">
                      <div>
                        <p className="text-xs text-white/40 leading-none">{format(new Date(booking.scheduled_at), "MMM")}</p>
                        <p className="text-lg font-black leading-none">{format(new Date(booking.scheduled_at), "d")}</p>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{booking.title}</p>
                      <p className="text-white/40 text-sm">
                        {format(new Date(booking.scheduled_at), "h:mm a")} · {booking.duration_minutes} min
                      </p>
                      {(booking.profiles || booking.fan_name) && (
                        <p className="text-white/30 text-xs mt-0.5">
                          {booking.profiles?.full_name || booking.profiles?.email || booking.fan_name}
                          {booking.fan_email && !booking.profiles && (
                            <span className="ml-1">· {booking.fan_email}</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold">{booking.price === 0 ? "Free" : `$${booking.price}`}</p>
                      <span className={`text-xs capitalize ${STATUS_COLORS[booking.status]}`}>{booking.status}</span>
                      <div className="mt-2">
                        <BookingActionButton bookingId={booking.id} status={booking.status} meetingUrl={booking.meeting_url} />
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
                {past.slice(0, 10).map((booking) => (
                  <div key={booking.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{booking.title}</p>
                      <p className="text-white/40 text-sm">{format(new Date(booking.scheduled_at), "MMM d, yyyy")}</p>
                    </div>
                    <span className={`text-xs capitalize ${STATUS_COLORS[booking.status]}`}>{booking.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 border border-white/10 rounded-2xl">
          <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg font-semibold mb-2">No bookings yet</p>
          <p className="text-white/30 text-sm mb-6">
            Fans can request sessions directly from your storefront once you have a booking product set up.
          </p>
          {(!bookingProducts || bookingProducts.length === 0) && (
            <Link
              href="/dashboard/products/create"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Add a 1-on-1 session product
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
