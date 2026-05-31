import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-8xl font-black mb-4">404</h1>
      <p className="text-white/50 text-xl mb-8">This page doesn&apos;t exist.</p>
      <Link href="/">
        <Button className="bg-white text-black hover:bg-white/90 font-bold">← Go home</Button>
      </Link>
    </div>
  );
}
