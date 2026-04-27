import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function TopNavbar() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-indigo-600" />
          <span className="font-bold text-xl tracking-tight text-slate-900">CreatorShield</span>
        </Link>
        <nav className="hidden md:flex gap-8 font-medium text-sm text-slate-600">
          <Link href="/dashboard" className="text-indigo-600 font-semibold">Dashboard</Link>
          <Link href="/dashboard#assets" className="hover:text-indigo-600 transition-colors">My Assets</Link>
          <Link href="/dashboard#detections" className="hover:text-indigo-600 transition-colors">Detections</Link>
          <Link href="/dashboard#takedowns" className="hover:text-indigo-600 transition-colors">Takedowns</Link>
        </nav>
        <div className="flex items-center gap-4">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
