import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, ArrowLeft } from "lucide-react";
import DeleteProductButton from "../products/delete-button";

const FILE_TYPE_EMOJI: Record<string, string> = {
  pdf: "📄",
  preset: "🎨",
  course: "🎓",
  video: "🎬",
};

export default async function DigitalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
  if (!creator) redirect("/onboarding");

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("creator_id", creator.id)
    .eq("type", "digital")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-black">Digital Products</h1>
            <p className="text-white/40 mt-1">PDFs, presets, courses, videos</p>
          </div>
        </div>
        <Link href="/dashboard/digital/new">
          <Button className="bg-white text-black hover:bg-white/90 font-bold gap-2">
            <Plus className="w-4 h-4" /> Add Digital
          </Button>
        </Link>
      </div>

      {products && products.length > 0 ? (
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl shrink-0">
                {FILE_TYPE_EMOJI[product.file_type] || "📁"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{product.name || product.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {product.file_type && (
                    <Badge variant="outline" className="text-xs border-white/20 text-white/50 uppercase">
                      {product.file_type}
                    </Badge>
                  )}
                  <span className={`text-xs ${product.active ? "text-green-400" : "text-white/30"}`}>
                    {product.active ? "Live" : "Draft"}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-bold">{product.price === 0 ? "Free" : `$${product.price}`}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Link href={`/dashboard/digital/${product.id}/edit`}>
                    <button className="text-xs text-white/40 hover:text-white transition-colors">Edit</button>
                  </Link>
                  <DeleteProductButton productId={product.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-white/10 rounded-2xl">
          <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg font-semibold mb-2">No digital products yet</p>
          <p className="text-white/30 text-sm mb-6">Sell PDFs, presets, courses, and more — instant delivery</p>
          <Link href="/dashboard/digital/new">
            <Button className="bg-white text-black hover:bg-white/90 font-bold">Add your first digital product</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
