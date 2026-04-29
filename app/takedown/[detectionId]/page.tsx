import { TopNavbar } from "@/components/dashboard/TopNavbar";
import { db } from "@/lib/db";
import { detections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TakedownClient } from "./TakedownClient";
import { syncUserToDatabase } from "@/lib/user-sync";

export default async function TakedownPage({ params }: { params: Promise<{ detectionId: string }> }) {
  const user = await currentUser();
  const { detectionId } = await params;
  
  if (!user) {
    redirect("/auth/login");
  }
  const syncedUser = await syncUserToDatabase(user);
  const userId = syncedUser.id;

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
