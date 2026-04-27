import { TopNavbar } from "@/components/dashboard/TopNavbar";
import { db } from "@/lib/db";
import { detections, assets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TakedownClient } from "./TakedownClient";

export default async function TakedownPage({ params }: { params: Promise<{ detectionId: string }> }) {
  const { userId } = await auth();
  const { detectionId } = await params;
  
  if (!userId) {
    redirect("/auth/login");
  }

  // Fetch detection and related asset
  const detection = await db.query.detections.findFirst({
    where: eq(detections.id, detectionId),
    with: {
      asset: true,
    }
  });

  if (!detection || detection.asset.userId !== userId) {
    // Return a basic not found component
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <TopNavbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl text-slate-500">Detection not found or unauthorized.</p>
        </div>
      </div>
    );
  }

  // Use a client component for the interactive generation parts
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopNavbar />
      <div className="flex-1 container mx-auto px-4 py-8">
         <TakedownClient detection={detection} asset={detection.asset} />
      </div>
    </div>
  );
}
