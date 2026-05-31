import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import EditProductClient from "./edit-client";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: creator } = await supabase.from("creators").select("id").eq("user_id", session.user.id).single();
  if (!creator) redirect("/onboarding");

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("creator_id", creator.id)
    .single();

  if (!product) notFound();

  return <EditProductClient product={product} />;
}
