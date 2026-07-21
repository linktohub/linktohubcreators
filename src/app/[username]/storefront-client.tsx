"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";
import { ShoppingCart, X, Plus, Minus, Loader2, ArrowLeft, Share2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe, StripeCardElement } from "@stripe/stripe-js";

type Creator = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url?: string;
  banner_url?: string;
  cover_url?: string;
  brand_color: string;
  instagram_url?: string;
  youtube_url?: string;
  twitter_url?: string;
  tiktok_url?: string;
  twitch_url?: string;
  merch_enabled: boolean;
  digital_enabled: boolean;
  ai_chat_enabled: boolean;
  calendar_enabled: boolean;
  events_enabled: boolean;
  subscriptions_enabled: boolean;
  tips_enabled: boolean;
};

type ProductMetadata = {
  modules?: { title: string; lessons: string[] }[];
  what_you_get?: string[];
  sections?: string[];
  pages?: number;
  items?: string[];
  count?: number;
  duration_minutes?: number;
};

type Product = {
  id: string;
  type: string;
  file_type?: string;
  name?: string;
  title?: string;
  description?: string;
  price: number;
  images?: string[];
  metadata?: ProductMetadata;
};

type Tier = {
  id: string;
  name: string;
  description?: string;
  price_monthly: number;
  price?: number;
  perks?: string[];
};

type Event = {
  id: string;
  title: string;
  type: string;
  starts_at: string;
  price: number;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  type: string;
};

type Tab = "store" | "digital" | "subscribe" | "events" | "ai";
type SelectedProduct = Product & { tiers?: never } | Tier & { type?: "subscription" };

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export default function StorefrontClient({
  creator, products, tiers, events,
}: {
  creator: Creator;
  products: Product[];
  tiers: Tier[];
  events: Event[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("store");
  const [selectedProduct, setSelectedProduct] = useState<Product | Tier | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [prAvailable, setPrAvailable] = useState<boolean | null>(null);
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [hasActiveSub, setHasActiveSub] = useState<boolean | null>(null);
  const [fanUser, setFanUser] = useState<{ id: string; email: string } | null | undefined>(undefined);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authLoading, setAuthLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  // Shipping fields for card checkout path
  const [shippingName, setShippingName] = useState("");
  const [shippingLine1, setShippingLine1] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingPostal, setShippingPostal] = useState("");
  const [shippingCountry, setShippingCountry] = useState("US");
  const [checkoutSuccess, setCheckoutSuccess] = useState<{
    cart: CartItem[];
    downloads: { title: string; url: string }[];
  } | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState<1 | 2>(1);
  const [selectedBookingProduct, setSelectedBookingProduct] = useState<Product | null>(null);
  const [bookingName, setBookingName] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const paymentRequestRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<Stripe | null>(null);
  const cardElementRef = useRef<StripeCardElement | null>(null);

  const brandColor = creator.brand_color || "#7c3aed";
  const bannerUrl = creator.banner_url || creator.cover_url;

  const merch = products.filter((p) => p.type === "merch" || p.type === "physical");
  const digital = products.filter((p) => p.type === "digital");
  const bookingProducts = products.filter((p) => p.type === "booking");
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const hasPhysical = cart.some((i) => i.type !== "digital");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source");
    const utmMedium = params.get("utm_medium");
    const utmCampaign = params.get("utm_campaign");
    if (utmSource) {
      sessionStorage.setItem("lh_utm_source", utmSource);
      sessionStorage.setItem("lh_utm_medium", utmMedium || "");
      sessionStorage.setItem("lh_utm_campaign", utmCampaign || "");
    }
    track(creator.id, "page_view", {
      username: creator.username,
      utm_source: utmSource || sessionStorage.getItem("lh_utm_source") || undefined,
      utm_medium: utmMedium || sessionStorage.getItem("lh_utm_medium") || undefined,
      utm_campaign: utmCampaign || sessionStorage.getItem("lh_utm_campaign") || undefined,
    });
  }, [creator.id, creator.username]);

  // Check fan auth status
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setFanUser(user ? { id: user.id, email: user.email || "" } : null);
    })();
  }, []);

  // Check if current user has an active subscription to this creator
  useEffect(() => {
    if (!creator.ai_chat_enabled) return;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setHasActiveSub(false); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!profile) { setHasActiveSub(false); return; }
      const { data: sub } = await supabase
        .from("fan_subscriptions")
        .select("id")
        .eq("creator_id", creator.id)
        .eq("fan_id", profile.id)
        .eq("status", "active")
        .maybeSingle();
      setHasActiveSub(!!sub);
    })();
  }, [creator.id, creator.ai_chat_enabled]);

  useEffect(() => {
    if (!cartOpen || cartTotal === 0 || !stripePromise) return;
    let mounted = true;
    setPrAvailable(null);
    cardElementRef.current = null;

    (async () => {
      const stripe = await stripePromise;
      if (!stripe || !mounted) return;
      stripeRef.current = stripe;

      const pr = stripe.paymentRequest({
        country: "US",
        currency: "usd",
        total: { label: "Your Order", amount: Math.round(cartTotal * 100) },
        requestPayerName: true,
        requestPayerEmail: true,
        shippingOptions: [{ id: "free", label: "Free shipping", detail: "Ships in 5–10 days", amount: 0 }],
        requestShipping: hasPhysical,
      });

      const canPay = await pr.canMakePayment();
      if (!mounted) return;

      if (canPay && paymentRequestRef.current) {
        paymentRequestRef.current.innerHTML = "";
        const elements = stripe.elements();
        const button = elements.create("paymentRequestButton", {
          paymentRequest: pr,
          style: { paymentRequestButton: { theme: "dark", height: "56px", type: "buy" } },
        });
        button.mount(paymentRequestRef.current);
        setPrAvailable(true);

        pr.on("paymentmethod", async (e) => {
          setCheckingOut(true);
          try {
            const sa = e.shippingAddress;
            const shipping = sa
              ? {
                  name: e.payerName || "",
                  line1: sa.addressLine?.[0] || "",
                  city: sa.city || "",
                  postal_code: sa.postalCode || "",
                  country: sa.country || "US",
                  state: sa.region || undefined,
                }
              : undefined;
            const res = await fetch("/api/checkout/intent", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                creatorId: creator.id,
                customerEmail: e.payerEmail,
                items: cart.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
                shipping,
                fanId: fanUser?.id,
                utmSource: sessionStorage.getItem("lh_utm_source") || undefined,
              }),
            });
            const { clientSecret } = await res.json();
            const { error } = await stripe.confirmCardPayment(
              clientSecret,
              { payment_method: e.paymentMethod.id },
              { handleActions: false }
            );
            if (error) {
              e.complete("fail");
              toast.error("Payment failed");
            } else {
              e.complete("success");
              const piId = clientSecret.split("_secret")[0];
              const successCart = [...cart];
              const hasDigital = successCart.some(i => i.type === "digital");
              track(creator.id, "purchase", {
                utm_source: sessionStorage.getItem("lh_utm_source") || undefined,
                utm_medium: sessionStorage.getItem("lh_utm_medium") || undefined,
                amount: cartTotal,
              });
              setCart([]);
              setCheckoutSuccess({ cart: successCart, downloads: [] });
              if (hasDigital) {
                const downloads = await pollForDownloads(piId);
                setCheckoutSuccess({ cart: successCart, downloads });
              }
            }
          } catch {
            e.complete("fail");
            toast.error("Payment failed");
          }
          setCheckingOut(false);
        });
      } else {
        // Fallback: mount card element
        setPrAvailable(false);
        if (cardRef.current) {
          cardRef.current.innerHTML = "";
          const elements = stripe.elements({
            appearance: {
              theme: "night",
              variables: {
                colorBackground: "#1a1a1a",
                colorText: "#ffffff",
                colorPrimary: brandColor,
                borderRadius: "12px",
              },
            },
          });
          const card = elements.create("card", {
            style: {
              base: {
                color: "#fff",
                fontSize: "16px",
                fontFamily: "inherit",
                "::placeholder": { color: "rgba(255,255,255,0.25)" },
              },
            },
          });
          card.mount(cardRef.current);
          cardElementRef.current = card;
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [cartOpen, cartTotal]);

  async function pollForDownloads(piId: string): Promise<{ title: string; url: string }[]> {
    for (let i = 0; i < 8; i++) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const res = await fetch(`/api/orders/by-intent?pi=${encodeURIComponent(piId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.download_urls?.length > 0) return data.download_urls;
        }
      } catch { /* continue polling */ }
    }
    return [];
  }

  async function handleCardPay() {
    if (!stripeRef.current || !cardElementRef.current) return;
    setCheckingOut(true);
    try {
      const shipping =
        hasPhysical && shippingLine1
          ? {
              name: shippingName,
              line1: shippingLine1,
              city: shippingCity,
              postal_code: shippingPostal,
              country: shippingCountry,
            }
          : undefined;
      const res = await fetch("/api/checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: creator.id,
          customerEmail: checkoutEmail,
          items: cart.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          shipping,
          fanId: fanUser?.id,
          utmSource: sessionStorage.getItem("lh_utm_source") || undefined,
        }),
      });
      const { clientSecret } = await res.json();
      const { error } = await stripeRef.current.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElementRef.current,
          billing_details: { email: checkoutEmail },
        },
      });
      if (error) {
        toast.error(error.message || "Payment failed");
      } else {
        const piId = clientSecret.split("_secret")[0];
        const successCart = [...cart];
        const hasDigital = successCart.some(i => i.type === "digital");
        track(creator.id, "purchase", {
          utm_source: sessionStorage.getItem("lh_utm_source") || undefined,
          utm_medium: sessionStorage.getItem("lh_utm_medium") || undefined,
          amount: cartTotal,
        });
        setCart([]);
        setCheckoutSuccess({ cart: successCart, downloads: [] });
        if (hasDigital) {
          const downloads = await pollForDownloads(piId);
          setCheckoutSuccess({ cart: successCart, downloads });
        }
      }
    } catch {
      toast.error("Payment failed");
    }
    setCheckingOut(false);
  }

  function addToCart(product: Product) {
    const name = product.name || product.title || "Product";
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: product.id, name, price: product.price, quantity: 1, image: product.images?.[0], type: product.type }];
    });
    toast.success(`${name} added to cart`);
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter((i) => i.quantity > 0));
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: `${creator.display_name} on Linktohub`,
      text: creator.bio ? creator.bio.slice(0, 100) : `Check out ${creator.display_name}'s store`,
      url,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share(shareData); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  }

  async function handleEmailCapture(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("email_subscribers")
      .select("id")
      .eq("creator_id", creator.id)
      .eq("email", email)
      .maybeSingle();
    await supabase
      .from("email_subscribers")
      .upsert({ creator_id: creator.id, email, source: "storefront" }, { onConflict: "creator_id,email" });
    setEmailSubmitted(true);
    toast.success("You're in!");
    // Notify creator of new subscriber (only on first sign-up, best-effort)
    if (!existing) {
      fetch("/api/notify/new-subscriber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId: creator.id, subscriberEmail: email }),
      }).catch(() => {});
    }
  }

  async function sendChat() {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatMessages((m) => [...m, { role: "user", text: userMsg }]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId: creator.id, message: userMsg, history: chatMessages }),
      });
      const data = await res.json();
      if (data.gate) {
        setChatMessages((m) => [...m, { role: "ai", text: `💬 AI Chat is a members-only perk. Subscribe to chat with ${creator.display_name}'s AI directly! Check the Members tab below.` }]);
        setTimeout(() => setActiveTab("subscribe"), 2000);
      } else {
        setChatMessages((m) => [...m, { role: "ai", text: data.reply }]);
      }
    } catch {
      setChatMessages((m) => [...m, { role: "ai", text: "Sorry, couldn't respond right now." }]);
    }
    setChatLoading(false);
  }

  function requireFanAuth(action?: string) {
    setPendingAction(action || null);
    setShowAuthModal(true);
  }

  async function handleFanAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    const supabase = createClient();
    let result;
    if (authMode === "signin") {
      result = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    } else {
      result = await supabase.auth.signUp({ email: authEmail, password: authPassword });
    }
    if (result.error) {
      toast.error(result.error.message);
      setAuthLoading(false);
      return;
    }
    const user = result.data.user;
    if (user) {
      setFanUser({ id: user.id, email: user.email || "" });
      setShowAuthModal(false);
      setAuthEmail("");
      setAuthPassword("");
      toast.success(authMode === "signin" ? "Signed in!" : "Account created!");
      // Execute pending action
      if (pendingAction?.startsWith("subscribe_")) {
        const tierId = pendingAction.replace("subscribe_", "");
        setTimeout(() => handleSubscribe(tierId), 500);
      } else if (pendingAction?.startsWith("event_")) {
        const eventId = pendingAction.replace("event_", "");
        setTimeout(() => handleEventRegister(eventId), 500);
      }
    }
    setAuthLoading(false);
  }

  async function handleSubscribe(tierId: string) {
    if (!fanUser) { requireFanAuth(`subscribe_${tierId}`); return; }
    setProcessingId(tierId);
    try {
      const res = await fetch("/api/checkout/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tierId,
          creatorId: creator.id,
          successUrl: window.location.href,
          cancelUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (data.auth) { requireFanAuth(`subscribe_${tierId}`); return; }
      if (data.url) window.location.href = data.url;
      else toast.error("Checkout unavailable right now");
    } catch { toast.error("Something went wrong"); }
    setProcessingId(null);
  }

  async function handleEventRegister(eventId: string) {
    if (!fanUser) { requireFanAuth(`event_${eventId}`); return; }
    setProcessingId(eventId);
    try {
      const res = await fetch("/api/checkout/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, successUrl: window.location.href, cancelUrl: window.location.href }),
      });
      const data = await res.json();
      if (data.auth) { requireFanAuth(`event_${eventId}`); return; }
      if (data.url) window.location.href = data.url;
      else toast.success("Registered!");
    } catch { toast.error("Something went wrong"); }
    setProcessingId(null);
  }

  async function handleTip() {
    if (!tipAmount || parseFloat(tipAmount) < 1) { toast.error("Minimum tip is $1"); return; }
    setProcessingId("tip");
    try {
      const res = await fetch("/api/checkout/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: creator.id,
          amount: tipAmount,
          successUrl: window.location.href,
          cancelUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { toast.error("Something went wrong"); }
    setProcessingId(null);
  }

  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBookingProduct) return;
    setBookingSubmitting(true);
    try {
      const res = await fetch("/api/bookings/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: creator.id,
          productId: selectedBookingProduct.id,
          fanName: bookingName,
          fanEmail: bookingEmail,
          preferredDate: bookingDate,
          preferredTime: bookingTime,
          message: bookingMessage || undefined,
        }),
      });
      if (res.ok) {
        setBookingSuccess(true);
      } else {
        toast.error("Something went wrong — please try again");
      }
    } catch {
      toast.error("Something went wrong — please try again");
    }
    setBookingSubmitting(false);
  }

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    ...(creator.merch_enabled || merch.length > 0 ? [{ id: "store" as Tab, label: "Merch", emoji: "👕" }] : []),
    ...(creator.digital_enabled || digital.length > 0 ? [{ id: "digital" as Tab, label: "Digital", emoji: "📚" }] : []),
    ...(creator.subscriptions_enabled && tiers.length > 0 ? [{ id: "subscribe" as Tab, label: "Members", emoji: "⭐" }] : []),
    ...(creator.events_enabled && events.length > 0 ? [{ id: "events" as Tab, label: "Events", emoji: "🎟️" }] : []),
    ...(creator.ai_chat_enabled ? [{ id: "ai" as Tab, label: "AI Chat", emoji: "🤖" }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-white">

      {/* Banner */}
      <div className="relative h-52 overflow-hidden">
        {bannerUrl
          ? <img src={bannerUrl} alt="banner" className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${brandColor}66 0%, ${brandColor}22 100%)` }} />
        }
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#050508]" />

        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="absolute top-4 left-4 w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center transition-opacity hover:opacity-80"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Cart in banner */}
        {cartCount > 0 && (
          <button onClick={() => setCartOpen(true)}
            className="absolute top-4 right-4 w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: brandColor }}>
            <ShoppingCart className="w-4 h-4 text-white" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-xs font-black rounded-full flex items-center justify-center">{cartCount}</span>
          </button>
        )}
      </div>

      <div className="max-w-xl mx-auto px-4">

        {/* Avatar — overlaps banner, full width name below */}
        <div className="-mt-10 mb-3 flex items-end justify-between">
          <div className="w-20 h-20 rounded-2xl border-4 border-[#050508] overflow-hidden flex items-center justify-center text-3xl font-black shrink-0"
            style={{ backgroundColor: brandColor }}>
            {creator.avatar_url
              ? <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
              : creator.display_name?.[0]?.toUpperCase()
            }
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2 text-white/60 hover:text-white hover:bg-white/[0.1] transition-colors text-xs font-medium"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>

        {/* Name — full width, no overlap */}
        <h1 className="text-2xl font-black leading-tight mb-0.5">{creator.display_name}</h1>
        <p className="text-white/40 text-sm mb-4">@{creator.username}</p>

        {/* Bio */}
        {creator.bio && (
          <p className="text-white/65 text-sm leading-relaxed mb-4">{creator.bio}</p>
        )}

        {/* Socials */}
        {(creator.instagram_url || creator.tiktok_url || creator.youtube_url || creator.twitter_url || creator.twitch_url) && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {creator.instagram_url && (
              <a href={`https://instagram.com/${creator.instagram_url.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-full px-3 py-1.5 transition-colors">
                <SocialIcon type="instagram" />
                <span className="text-white/70 text-xs font-medium">@{creator.instagram_url.replace("@", "")}</span>
              </a>
            )}
            {creator.tiktok_url && (
              <a href={`https://tiktok.com/@${creator.tiktok_url.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-full px-3 py-1.5 transition-colors">
                <SocialIcon type="tiktok" />
                <span className="text-white/70 text-xs font-medium">@{creator.tiktok_url.replace("@", "")}</span>
              </a>
            )}
            {creator.youtube_url && (
              <a href={creator.youtube_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-full px-3 py-1.5 transition-colors">
                <SocialIcon type="youtube" />
                <span className="text-white/70 text-xs font-medium">YouTube</span>
              </a>
            )}
            {creator.twitter_url && (
              <a href={`https://twitter.com/${creator.twitter_url.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-full px-3 py-1.5 transition-colors">
                <SocialIcon type="twitter" />
                <span className="text-white/70 text-xs font-medium">@{creator.twitter_url.replace("@", "")}</span>
              </a>
            )}
          </div>
        )}

        {/* CTA row */}
        {(() => {
          const allThree = creator.calendar_enabled && creator.ai_chat_enabled && creator.tips_enabled;
          return (
            <div className={allThree ? "grid grid-cols-2 gap-2 mb-7" : "flex gap-2 mb-7 flex-wrap"}>
              {creator.calendar_enabled && (
                <button className="h-12 rounded-xl font-black text-sm text-white bg-white/[0.07] border border-white/20 hover:bg-white/[0.12] active:opacity-75 transition-all"
                  onClick={() => { setShowBookingModal(true); setBookingStep(1); setBookingSuccess(false); setSelectedBookingProduct(null); }}>
                  📅 Book
                </button>
              )}
              {creator.ai_chat_enabled && (
                <button className="h-12 rounded-xl font-black text-sm text-white active:opacity-75 transition-opacity"
                  style={{ backgroundColor: brandColor }}
                  onClick={() => setActiveTab("ai")}>
                  🤖 Chat with AI
                </button>
              )}
              {creator.tips_enabled && (
                <div className={`flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 h-12 ${allThree ? "col-span-2" : "flex-1 min-w-[140px]"}`}>
                  <span className="text-white/40 text-sm font-medium">$</span>
                  <input type="number" value={tipAmount} onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="Tip amount" className="flex-1 min-w-0 bg-transparent text-white text-sm outline-none placeholder:text-white/25" />
                  <button className="text-white font-black text-sm px-3 h-8 rounded-lg disabled:opacity-50 shrink-0 active:opacity-75 transition-opacity" style={{ backgroundColor: brandColor }}
                    disabled={processingId === "tip"}
                    onClick={handleTip}>
                    {processingId === "tip" ? "..." : "Send"}
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Email capture */}
        {!emailSubmitted ? (
          <div className="mb-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">✉️</span>
              <p className="font-bold text-sm text-white">Join {creator.display_name}&apos;s inner circle</p>
            </div>
            <p className="text-white/40 text-xs mb-4 leading-relaxed">Be first to know about drops, exclusive content, and offers — no spam, unsubscribe any time</p>
            <form onSubmit={handleEmailCapture} className="flex gap-2">
              <input type="email" placeholder="your@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required
                className="flex-1 h-11 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/20" />
              <button type="submit" className="h-11 px-5 rounded-xl font-black text-sm text-white shrink-0 active:opacity-75 transition-opacity"
                style={{ backgroundColor: brandColor }}>
                Join
              </button>
            </form>
          </div>
        ) : (
          <div className="mb-7 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 flex items-center gap-3">
            <span className="text-emerald-400 text-lg">✓</span>
            <div>
              <p className="text-emerald-400 text-sm font-bold">You&apos;re in!</p>
              <p className="text-white/30 text-xs">Check your inbox for a welcome from {creator.display_name}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        {tabs.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-none -mx-4 px-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap shrink-0 transition-all active:opacity-75"
                  style={isActive
                    ? { backgroundColor: brandColor, color: "#fff" }
                    : { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)" }
                  }>
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Store tab */}
        {(activeTab === "store" || tabs.length === 0) && merch.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-16">
            {merch.map((product) => (
              <ProductCard key={product.id} product={product} brandColor={brandColor} onAdd={() => addToCart(product)} onView={() => setSelectedProduct(product)} />
            ))}
          </div>
        )}
        {(activeTab === "store" || tabs.length === 0) && merch.length === 0 && (
          <div className="flex flex-col items-center text-center py-14 px-4 gap-4 mb-16">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-3xl">🛍️</div>
            <div>
              <p className="font-bold text-white/60 text-base">Store coming soon</p>
              <p className="text-white/30 text-sm mt-1.5 max-w-[220px] leading-relaxed mx-auto">
                {creator.display_name} is setting things up — join their list to be first when drops go live.
              </p>
            </div>
          </div>
        )}

        {/* Digital tab */}
        {activeTab === "digital" && (
          <div className="space-y-3 mb-16">
            {digital.map((product) => {
              const name = product.name || product.title || "Product";
              return (
                <button key={product.id} onClick={() => setSelectedProduct(product)}
                  className="flex items-center gap-4 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 w-full text-left hover:border-white/20 transition-colors">
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-2xl"
                    style={{ backgroundColor: brandColor + "33" }}>
                    {product.images?.[0]
                      ? <img src={product.images[0]} alt={name} className="w-full h-full object-cover" />
                      : "📄"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{name}</p>
                    {product.description && <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{product.description}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-black text-lg">{product.price === 0 ? "Free" : `$${product.price}`}</p>
                    <p className="text-white/30 text-xs mt-0.5">Tap to view</p>
                  </div>
                </button>
              );
            })}
            {digital.length === 0 && (
              <div className="flex flex-col items-center text-center py-14 px-4 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-3xl">📚</div>
                <div>
                  <p className="font-bold text-white/60 text-base">Digital products coming soon</p>
                  <p className="text-white/30 text-sm mt-1.5 max-w-[220px] leading-relaxed mx-auto">
                    {creator.display_name} is working on it — subscribe above to be first in line.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Subscribe tab */}
        {activeTab === "subscribe" && (
          <div className="space-y-4 mb-16">
            {tiers.map((tier, idx) => {
              const price = tier.price_monthly || tier.price || 0;
              const isPopular = tiers.length > 1 && idx === Math.floor(tiers.length / 2);
              return (
                <div key={tier.id} className={`rounded-2xl p-6 transition-all ${isPopular ? "border border-violet-500/40 bg-violet-500/[0.05] ring-1 ring-violet-500/20" : "border border-white/[0.08] bg-white/[0.02]"}`}>
                  {isPopular && (
                    <span className="inline-block text-[10px] font-black tracking-widest uppercase text-violet-300 bg-violet-500/20 px-3 py-1 rounded-full mb-3">
                      Most popular
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-black">{tier.name}</h3>
                    <span className="text-2xl font-black">${price}<span className="text-sm font-normal text-white/40">/mo</span></span>
                  </div>
                  {tier.description && <p className="text-white/50 text-sm mb-4">{tier.description}</p>}
                  {tier.perks && tier.perks.length > 0 && (
                    <ul className="space-y-2 mb-5">
                      {tier.perks.map((perk, i) => (
                        <li key={i} className="text-sm text-white/70 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: brandColor }} />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    className={`w-full h-12 rounded-xl font-black text-white text-sm disabled:opacity-60 active:opacity-75 transition-opacity ${isPopular ? "btn-gradient" : ""}`}
                    style={isPopular ? undefined : { backgroundColor: brandColor }}
                    disabled={processingId === tier.id}
                    onClick={() => handleSubscribe(tier.id)}>
                    {processingId === tier.id ? "Loading..." : fanUser === null ? `Sign in to subscribe` : `Subscribe — $${price}/mo`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Events tab */}
        {activeTab === "events" && (
          <div className="space-y-3 mb-16">
            {events.map((event) => (
              <div key={event.id} className="flex items-center gap-4 border border-white/[0.08] rounded-2xl p-4 bg-white/[0.02]">
                <div className="w-14 shrink-0 text-center bg-white/[0.05] rounded-xl p-2">
                  <p className="text-white/40 text-[10px] uppercase">{new Date(event.starts_at).toLocaleString("default", { month: "short" })}</p>
                  <p className="text-2xl font-black">{new Date(event.starts_at).getDate()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{event.title}</p>
                  <p className="text-white/40 text-xs mt-0.5 capitalize">{event.type}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-black">{event.price === 0 ? "Free" : `$${event.price}`}</p>
                  <button className="mt-1.5 text-white text-xs font-black px-3 h-10 rounded-xl disabled:opacity-60 flex items-center justify-center active:opacity-75 transition-opacity"
                    style={{ backgroundColor: brandColor }}
                    disabled={processingId === event.id}
                    onClick={() => handleEventRegister(event.id)}>
                    {processingId === event.id ? "..." : event.price === 0 ? "Free RSVP" : "Register"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Chat tab */}
        {activeTab === "ai" && (
          <div className="mb-16">
            <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-white/[0.02]">
              <div className="p-4 border-b border-white/[0.08] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: brandColor + "33" }}>🤖</div>
                <div>
                  <p className="font-bold text-sm">{creator.display_name}&apos;s AI</p>
                  <p className="text-white/35 text-xs">Trained on their content & voice</p>
                </div>
              </div>

              {/* Paywall: show spinner while checking, locked state if no sub */}
              {hasActiveSub === null && (
                <div className="h-80 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-white/30" />
                </div>
              )}

              {hasActiveSub === false && (
                <div className="h-80 flex flex-col items-center justify-center px-8 text-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-violet-500/10 border border-violet-500/20">🔒</div>
                  <div>
                    <p className="font-bold text-white">Members only</p>
                    <p className="text-white/45 text-sm mt-1">Subscribe to chat with {creator.display_name}&apos;s AI</p>
                  </div>
                  {tiers.length > 0 && (
                    <button
                      className="h-11 px-6 rounded-xl font-bold text-sm text-white"
                      style={{ backgroundColor: brandColor }}
                      onClick={() => setActiveTab("subscribe")}
                    >
                      View membership plans
                    </button>
                  )}
                </div>
              )}

              {hasActiveSub === true && (
                <>
                  <div className="h-80 p-4 space-y-3 overflow-y-auto">
                    {chatMessages.length === 0 && (
                      <p className="text-white/25 text-sm text-center mt-10">
                        Ask me anything about {creator.display_name}
                      </p>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
                          msg.role === "user" ? "bg-white text-black" : "bg-white/[0.08] text-white"
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white/[0.06] rounded-2xl px-4 py-2.5 text-sm text-white/40">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-white/[0.08] flex gap-2">
                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendChat()}
                      placeholder="Ask something..."
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/20" />
                    <button onClick={sendChat} disabled={chatLoading}
                      className="h-11 min-w-[44px] px-4 text-white font-bold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center shrink-0"
                      style={{ backgroundColor: brandColor }}>
                      →
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setShowBookingModal(false); setBookingSuccess(false); }} />
          <div className="relative w-full max-w-md bg-[#111] rounded-t-3xl border-t border-white/[0.08] flex flex-col max-h-[90vh]">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] shrink-0">
              <h2 className="font-black text-xl">
                {bookingSuccess ? "Request Sent!" : bookingStep === 1 ? "Book a Session" : "Your Details"}
              </h2>
              <button onClick={() => { setShowBookingModal(false); setBookingSuccess(false); }}
                className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-10 pt-4">
              {bookingSuccess ? (
                <div className="flex flex-col items-center text-center gap-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-3xl">✓</div>
                  <div>
                    <p className="font-black text-xl text-white">Request sent!</p>
                    <p className="text-white/50 text-sm mt-2 leading-relaxed">
                      {creator.display_name} will confirm within 24 hours. Check your email for a confirmation.
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowBookingModal(false); setBookingSuccess(false); }}
                    className="h-12 px-8 rounded-xl font-bold text-white text-sm mt-2"
                    style={{ backgroundColor: brandColor }}
                  >
                    Done
                  </button>
                </div>
              ) : bookingStep === 1 ? (
                <div className="space-y-3">
                  {bookingProducts.length === 0 ? (
                    <div className="flex flex-col items-center text-center gap-3 py-10">
                      <span className="text-4xl">📅</span>
                      <p className="text-white/60 text-sm">This creator hasn&apos;t set up booking sessions yet.</p>
                    </div>
                  ) : (
                    bookingProducts.map((p) => {
                      const name = p.name || p.title || "Session";
                      const duration = p.metadata?.duration_minutes;
                      return (
                        <button key={p.id}
                          onClick={() => { setSelectedBookingProduct(p); setBookingStep(2); }}
                          className="w-full flex items-center gap-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 text-left hover:border-white/20 transition-colors active:opacity-75">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                            style={{ backgroundColor: brandColor + "33" }}>
                            📅
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm">{name}</p>
                            {duration && <p className="text-white/40 text-xs mt-0.5">{duration} min · 1-on-1</p>}
                          </div>
                          <div className="shrink-0">
                            <p className="font-black text-base">{p.price === 0 ? "Free" : `$${p.price}`}</p>
                            <p className="text-white/30 text-xs text-right mt-0.5">Select →</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-3">
                  {selectedBookingProduct && (
                    <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.07] rounded-xl p-3 mb-5">
                      <span className="text-xl">📅</span>
                      <div>
                        <p className="font-bold text-sm">{selectedBookingProduct.name || selectedBookingProduct.title}</p>
                        {selectedBookingProduct.metadata?.duration_minutes && (
                          <p className="text-white/40 text-xs">{selectedBookingProduct.metadata.duration_minutes} min</p>
                        )}
                      </div>
                      <button type="button" onClick={() => setBookingStep(1)}
                        className="ml-auto text-white/30 hover:text-white text-xs">
                        Change
                      </button>
                    </div>
                  )}
                  <input type="text" placeholder="Your name" value={bookingName} onChange={(e) => setBookingName(e.target.value)} required
                    className="w-full h-12 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/20" />
                  <input type="email" placeholder="Your email" value={bookingEmail} onChange={(e) => setBookingEmail(e.target.value)} required
                    className="w-full h-12 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/20" />
                  <div className="flex gap-2">
                    <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} required
                      min={new Date().toISOString().split("T")[0]}
                      className="flex-1 h-12 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 text-white text-sm outline-none focus:border-white/20 [color-scheme:dark]" />
                    <input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} required
                      className="w-32 h-12 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 text-white text-sm outline-none focus:border-white/20 [color-scheme:dark]" />
                  </div>
                  <textarea placeholder="Message (optional)" value={bookingMessage} onChange={(e) => setBookingMessage(e.target.value)} rows={3}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/20 resize-none" />
                  <button type="submit" disabled={bookingSubmitting}
                    className="w-full h-12 rounded-xl font-bold text-white text-sm disabled:opacity-50 mt-2"
                    style={{ backgroundColor: brandColor }}>
                    {bookingSubmitting ? "Sending..." : "Send Request"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fan Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
          <div className="relative w-full max-w-md bg-[#111] rounded-t-3xl border-t border-white/[0.08] p-6 pb-10">
            <div className="flex justify-center mb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
            {/* Creator identity header */}
            <div className="flex flex-col items-center gap-3 mb-6 mt-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-white/10">
                {creator.avatar_url
                  ? <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl font-black"
                         style={{ background: `linear-gradient(135deg, ${creator.brand_color || "#7c3aed"}, #c026d3)` }}>
                      {creator.display_name?.[0]?.toUpperCase() || "?"}
                    </div>
                }
              </div>
              <div className="text-center">
                <p className="font-black text-lg leading-tight truncate max-w-[220px]">{creator.display_name}</p>
                <p className="text-white/40 text-sm mt-0.5">
                  {authMode === "signin" ? "Sign in to access exclusive content" : "Join their community"}
                </p>
              </div>
            </div>
            <div className="flex gap-1 bg-white/[0.05] rounded-xl p-1 mb-6">
              {(["signin", "signup"] as const).map((m) => (
                <button key={m} onClick={() => setAuthMode(m)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${authMode === m ? "bg-white text-black" : "text-white/40 hover:text-white"}`}>
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>
            <form onSubmit={handleFanAuth} className="space-y-3">
              <input type="email" placeholder="Your email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required
                className="w-full h-12 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/30" />
              <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} required
                className="w-full h-12 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/30" />
              <button type="submit" disabled={authLoading}
                className="w-full h-12 rounded-xl font-bold text-white text-sm disabled:opacity-50"
                style={{ backgroundColor: brandColor }}>
                {authLoading ? "..." : authMode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Creator acquisition bar */}
      <div className="border-t border-white/[0.06] mt-4 mx-4 mb-6 rounded-2xl bg-gradient-to-br from-violet-600/[0.08] to-fuchsia-600/[0.04] border border-violet-500/20 px-5 py-6 text-center">
        <p className="text-white/70 font-black text-base mb-1">Sell like {creator.display_name}.</p>
        <p className="text-white/40 text-xs mb-4 leading-relaxed">500+ creators already earn with their own storefront.<br />AI builds everything. Your link is live in 10 minutes.</p>
        <a
          href={`https://linktohub.vercel.app/auth/signup?utm_source=storefront&utm_medium=footer&utm_campaign=creator_cta&utm_content=${creator.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-black font-black text-sm px-6 py-3 rounded-xl hover:bg-white/90 active:opacity-80 transition-colors shadow-lg"
        >
          Start for free — no credit card
        </a>
        <p className="text-white/15 text-[10px] mt-3">Powered by Linktohub</p>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
          <div className="relative bg-[#111] rounded-t-3xl max-h-[90vh] flex flex-col border-t border-white/[0.08] overflow-hidden">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            {/* Close */}
            <button onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center z-10">
              <X className="w-4 h-4 text-white/60" />
            </button>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Product image */}
              {"images" in selectedProduct && selectedProduct.images?.[0] && (
                <div className="w-full h-52 overflow-hidden">
                  <img src={selectedProduct.images[0]} alt={("title" in selectedProduct ? selectedProduct.title : ("name" in selectedProduct ? selectedProduct.name : "")) || ""} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="p-6 space-y-4">
                {/* Type badge */}
                {"type" in selectedProduct && selectedProduct.type && (
                  <span className="inline-flex items-center bg-white/[0.06] border border-white/[0.08] rounded-full px-3 py-1 text-xs font-medium text-white/50 capitalize">
                    {"type" in selectedProduct && selectedProduct.type === "digital" ? "Digital Product" : selectedProduct.type}
                  </span>
                )}
                {!("type" in selectedProduct) && (
                  <span className="inline-flex items-center bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs font-medium text-violet-300">
                    ⭐ Membership
                  </span>
                )}

                {/* Title */}
                <h2 className="text-2xl font-black text-white leading-tight pr-10">
                  {"title" in selectedProduct ? selectedProduct.title : ("name" in selectedProduct ? selectedProduct.name : "")}
                </h2>

                {/* Description */}
                {"description" in selectedProduct && selectedProduct.description && (
                  <p className="text-white/60 text-sm leading-relaxed">{selectedProduct.description}</p>
                )}

                {/* Course modules */}
                {"metadata" in selectedProduct && (selectedProduct as Product).metadata?.modules && (
                  <div className="space-y-3">
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Full Course Outline</p>
                    {(selectedProduct as Product).metadata!.modules!.map((mod, i) => (
                      <div key={i} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
                        <p className="font-bold text-sm text-white mb-2">{mod.title}</p>
                        <div className="space-y-1.5">
                          {mod.lessons.map((lesson, j) => (
                            <p key={j} className="text-white/50 text-xs flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-violet-500/20 text-violet-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5">{j + 1}</span>
                              {lesson}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                    {(selectedProduct as Product).metadata?.what_you_get && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(selectedProduct as Product).metadata!.what_you_get!.map((w, i) => (
                          <span key={i} className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full">{w}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PDF sections */}
                {"metadata" in selectedProduct && (selectedProduct as Product).metadata?.sections && (
                  <div>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-3">
                      What&apos;s Inside — {(selectedProduct as Product).metadata?.pages || 20}+ pages
                    </p>
                    <div className="space-y-2">
                      {(selectedProduct as Product).metadata!.sections!.map((s, i) => (
                        <p key={i} className="text-white/65 text-sm flex items-center gap-2">
                          <span className="text-violet-400 shrink-0">→</span> {s}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preset items */}
                {"metadata" in selectedProduct && (selectedProduct as Product).metadata?.items && (
                  <div>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-3">
                      {(selectedProduct as Product).metadata?.count || 15} items included
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(selectedProduct as Product).metadata!.items!.map((item, i) => (
                        <span key={i} className="bg-fuchsia-500/10 text-fuchsia-400 text-xs px-3 py-1.5 rounded-full">{item}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Booking duration */}
                {"metadata" in selectedProduct && (selectedProduct as Product).metadata?.duration_minutes && (
                  <div className="flex gap-3">
                    <span className="bg-cyan-500/10 text-cyan-400 text-sm px-4 py-2 rounded-xl font-semibold">
                      📅 {(selectedProduct as Product).metadata!.duration_minutes} min session
                    </span>
                    <span className="bg-white/[0.05] text-white/50 text-sm px-4 py-2 rounded-xl">1-on-1</span>
                  </div>
                )}

                {/* Perks (for subscription tiers) */}
                {"perks" in selectedProduct && selectedProduct.perks && (selectedProduct.perks as string[]).length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">What you get</p>
                    {(selectedProduct.perks as string[]).map((perk: string, i: number) => (
                      <p key={i} className="text-white/70 text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: brandColor }} />
                        {perk}
                      </p>
                    ))}
                  </div>
                )}

                {/* Price + action */}
                <div className="pt-2 border-t border-white/[0.07]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      {"price_monthly" in selectedProduct ? (
                        <p className="text-3xl font-black text-white">${selectedProduct.price_monthly}<span className="text-base font-normal text-white/40">/mo</span></p>
                      ) : (
                        <p className="text-3xl font-black text-white">
                          {("price" in selectedProduct && selectedProduct.price === 0) ? "Free" : `$${"price" in selectedProduct ? selectedProduct.price : ""}`}
                        </p>
                      )}
                    </div>
                  </div>
                  {"price_monthly" in selectedProduct ? (
                    <button className="w-full h-14 rounded-2xl font-black text-white text-base disabled:opacity-60"
                      style={{ backgroundColor: brandColor }}
                      disabled={processingId === selectedProduct.id}
                      onClick={() => { setSelectedProduct(null); handleSubscribe(selectedProduct.id); }}>
                      {processingId === selectedProduct.id ? "Loading..." : fanUser === null ? "Sign in to subscribe" : `Subscribe · $${selectedProduct.price_monthly}/mo`}
                    </button>
                  ) : (
                    <button className="w-full h-14 rounded-2xl font-black text-white text-base"
                      style={{ backgroundColor: brandColor }}
                      onClick={() => {
                        if ("type" in selectedProduct) addToCart(selectedProduct as Product);
                        setSelectedProduct(null);
                      }}>
                      {"type" in selectedProduct && (selectedProduct as Product).type === "digital"
                        ? `Get it${("price" in selectedProduct && selectedProduct.price === 0) ? " — Free" : ""}`
                        : "Add to cart"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating cart button */}
      {cartCount > 0 && !cartOpen && (
        <button onClick={() => setCartOpen(true)}
          className="fixed floating-action right-5 h-14 px-5 rounded-2xl flex items-center gap-2.5 text-white font-black shadow-xl shadow-black/40 z-50"
          style={{ backgroundColor: brandColor }}>
          <ShoppingCart className="w-5 h-5" />
          <span>{cartCount} item{cartCount !== 1 ? "s" : ""}</span>
          <span className="text-white/80">· ${cartTotal.toFixed(2)}</span>
        </button>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setCartOpen(false); setCheckoutSuccess(null); }} />
          <div className="relative bg-[#111] rounded-t-3xl max-h-[90vh] flex flex-col border-t border-white/[0.08]">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
              <h2 className="font-black text-xl">{checkoutSuccess ? "Order Confirmed" : "Your Cart"}</h2>
              <button onClick={() => { setCartOpen(false); setCheckoutSuccess(null); }} className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {checkoutSuccess ? (
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 pb-8">
                <div className="flex flex-col items-center text-center gap-3 py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-3xl">✓</div>
                  <div>
                    <p className="font-black text-xl text-white">You&apos;re all set!</p>
                    <p className="text-white/45 text-sm mt-1">Check your email for a receipt.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Order summary</p>
                  {checkoutSuccess.cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-xl"
                        style={{ backgroundColor: brandColor + "33" }}>
                        {item.image
                          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          : item.type === "digital" ? "📄" : "👕"}
                      </div>
                      <p className="flex-1 font-semibold text-sm truncate">{item.name}</p>
                      <p className="text-white/50 text-sm shrink-0">×{item.quantity}</p>
                      <p className="font-black text-sm w-14 text-right shrink-0">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {checkoutSuccess.cart.some(i => i.type === "digital") && (
                  <div className="space-y-2">
                    <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Your downloads</p>
                    {checkoutSuccess.downloads.length === 0 ? (
                      <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
                        <Loader2 className="w-4 h-4 animate-spin text-white/40 shrink-0" />
                        <p className="text-white/50 text-sm">Preparing your files…</p>
                      </div>
                    ) : (
                      checkoutSuccess.downloads.map((dl, i) => (
                        <a key={i} href={dl.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 bg-violet-600/20 border border-violet-600/30 rounded-xl p-4 group">
                          <span className="text-sm font-bold text-white truncate">{dl.title}</span>
                          <span className="text-violet-400 font-bold text-sm shrink-0 group-hover:text-violet-300">Download →</span>
                        </a>
                      ))
                    )}
                  </div>
                )}

                <button
                  onClick={() => { setCartOpen(false); setCheckoutSuccess(null); }}
                  className="w-full h-14 rounded-2xl font-black text-white text-base"
                  style={{ backgroundColor: brandColor }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl p-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-2xl"
                        style={{ backgroundColor: brandColor + "33" }}>
                        {item.image
                          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          : item.type === "digital" ? "📄" : "👕"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{item.name}</p>
                        <p className="text-white/40 text-xs mt-0.5">${item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => updateQty(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.1]">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.1]">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-black text-sm w-16 text-right shrink-0">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {/* Totals + pay */}
                <div className="px-6 pb-8 pt-4 border-t border-white/[0.07] space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-white/50">
                      <span>Subtotal</span><span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-white/50">
                      <span>Shipping</span>
                      <span className="text-emerald-400 font-semibold">Free</span>
                    </div>
                    <div className="flex justify-between font-black text-lg pt-1">
                      <span>Total</span><span>${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Loading state */}
                  {prAvailable === null && (
                    <div className="w-full h-14 rounded-2xl bg-white/[0.06] animate-pulse" />
                  )}

                  {/* Apple Pay / Google Pay button */}
                  <div ref={paymentRequestRef} className={prAvailable === true ? "w-full" : "hidden"} />

                  {/* Card fallback */}
                  {prAvailable === false && (
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Email for receipt"
                        value={checkoutEmail}
                        onChange={(e) => setCheckoutEmail(e.target.value)}
                        className="w-full h-12 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/20"
                      />
                      {hasPhysical && (
                        <div className="space-y-2">
                          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Shipping address</p>
                          <input placeholder="Full name" value={shippingName} onChange={(e) => setShippingName(e.target.value)}
                            className="w-full h-11 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/20" />
                          <input placeholder="Address line 1" value={shippingLine1} onChange={(e) => setShippingLine1(e.target.value)}
                            className="w-full h-11 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/20" />
                          <div className="flex gap-2">
                            <input placeholder="City" value={shippingCity} onChange={(e) => setShippingCity(e.target.value)}
                              className="flex-1 h-11 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/20" />
                            <input placeholder="ZIP" value={shippingPostal} onChange={(e) => setShippingPostal(e.target.value)}
                              className="w-24 h-11 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/20" />
                          </div>
                          <input placeholder="Country (e.g. US)" value={shippingCountry} onChange={(e) => setShippingCountry(e.target.value)}
                            className="w-full h-11 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/20" />
                        </div>
                      )}
                      <div ref={cardRef} className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl p-4 min-h-[52px]" />
                      <button
                        onClick={handleCardPay}
                        disabled={checkingOut || !checkoutEmail || (hasPhysical && (!shippingLine1 || !shippingCity || !shippingPostal))}
                        className="w-full h-14 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ backgroundColor: brandColor }}
                      >
                        {checkingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay $${cartTotal.toFixed(2)}`}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, brandColor, onAdd, onView }: { product: Product; brandColor: string; onAdd: () => void; onView: () => void }) {
  const name = product.name || product.title || "Product";
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform" onClick={onView}>
      <div className="aspect-square overflow-hidden flex items-center justify-center text-4xl bg-white/[0.03]">
        {product.images?.[0]
          ? <img src={product.images[0]} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : product.type === "merch" ? "👕" : "📦"
        }
      </div>
      <div className="p-3">
        <p className="font-bold text-sm truncate text-white">{name}</p>
        {product.description && <p className="text-white/35 text-xs mt-0.5 line-clamp-1">{product.description}</p>}
        <div className="flex items-center justify-between mt-2">
          <span className="font-black text-base">${product.price}</span>
          <button onClick={(e) => { e.stopPropagation(); onAdd(); }}
            className="text-white text-xs font-black px-3 h-11 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            style={{ backgroundColor: brandColor }}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function SocialIcon({ type }: { type: "instagram" | "youtube" | "twitter" | "tiktok" }) {
  if (type === "instagram") return <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
  if (type === "youtube") return <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
  if (type === "twitter") return <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
  return <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.28 8.28 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z"/></svg>;
}
