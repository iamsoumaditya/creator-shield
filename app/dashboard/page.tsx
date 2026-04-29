import { StatsRow } from "@/components/dashboard/StatsRow";
import { AssetGrid } from "@/components/dashboard/AssetGrid";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { assets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUserToDatabase } from "@/lib/user-sync";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const syncedUser = await syncUserToDatabase(user);
  const userId = syncedUser.id;

  // Fetch from DB
  const userAssets = await db.query.assets.findMany({
    where: eq(assets.userId, userId),
    with: {
      detections: true,
    },
    orderBy: (assets, { desc }) => [desc(assets.createdAt)],
  });

  // Calculate stats
  const totalAssets = userAssets.length;
  let activeDetections = 0;
  const takedownsSent = 0;
  let resolved = 0;

  const transformedAssets = userAssets.map((asset) => {
    let detectionCount = 0;
    asset.detections.forEach((d) => {
      detectionCount++;
      if (d.status === "UNAUTHORIZED" || d.status === "REVIEWING") activeDetections++;
      // check takedowns sent - we don't fetch takedown table here intentionally, we'll approximate based on status if we don't have separate query
      // actually, to be precise, let's just use status
      if (d.status === "RESOLVED") resolved++;
    });
    
    return {
      ...asset,
      _count: { detections: detectionCount }
    };
  });

  const stats = {
    totalAssets,
    activeDetections,
    takedownsSent, // Mock for now until we query takedown table
    resolved
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Monitor and protect your digital assets across the web.</p>
        </div>
        <Link href="/assets/register">
          <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm gap-2">
            <Plus className="w-5 h-5" />
            Register New Asset
          </Button>
        </Link>
      </div>

      <StatsRow stats={stats} />

      <div className="mt-12" id="assets">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Your Protected Assets</h2>
        </div>
        <AssetGrid assets={transformedAssets} />
      </div>
    </div>
  );
}
