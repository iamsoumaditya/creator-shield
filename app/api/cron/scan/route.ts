import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { performScan } from "@/lib/scan";

export const maxDuration = 300; // Allow maximum duration for cron jobs on Vercel (up to 5 mins on free/pro tier)

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const allAssets = await db.query.assets.findMany({
      with: { detections: true }
    });

    let totalScanned = 0;
    let totalDetections = 0;

    for (const asset of allAssets) {
      try {
        const result = await performScan(asset);
        totalScanned++;
        if (result.newDetections) {
          totalDetections += result.newDetections;
        }
      } catch (error) {
        console.error(`Failed to scan asset ${asset.id}:`, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      totalScanned, 
      totalDetections 
    });
  } catch (error) {
    console.error("Cron scan error:", error);
    return NextResponse.json({ error: "Failed to run cron scan" }, { status: 500 });
  }
}
