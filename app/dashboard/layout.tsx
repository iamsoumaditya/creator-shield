import { TopNavbar } from "@/components/dashboard/TopNavbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopNavbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
