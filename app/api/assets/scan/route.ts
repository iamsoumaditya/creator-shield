import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assets, detections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import fs from "fs/promises";
import path from "path";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const client = await clerkClient();
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await client.users.getUser(userId)
    if (!user.publicMetadata.paid)
      return NextResponse.json({ error: "Scan only avialable for paid Users" }, { status: 403 });

    const { assetId } = await req.json();
    
    const asset = await db.query.assets.findFirst({
      where: eq(assets.id, assetId),
      with: { detections: true }
    });

    if (!asset || asset.userId !== userId) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      return NextResponse.json({ error: "Vision API Key missing from backend" }, { status: 500 });
    }

    // Call Cloud Vision
    // Read the local original image to base64
    const originalFilename = asset.originalUrl.split('/').pop() || "";
    const filePath = path.join(process.cwd(), "public", "uploads", originalFilename);
    const fileBuffer = await fs.readFile(filePath);
    const base64Image = fileBuffer.toString("base64");

    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`;
    
    const visionRes = await fetch(visionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: "WEB_DETECTION", maxResults: 10 }]
          }
        ]
      })
    });

    const visionData = await visionRes.json();
    
    if (!visionRes.ok) throw new Error(visionData.error?.message || "Vision API failed");

    const webDetection = visionData.responses[0]?.webDetection;
    const pagesWithMatchingImages = webDetection?.pagesWithMatchingImages || [];

    // Filter and add new detections
    let newDetectionsCount = 0;

    for (const page of pagesWithMatchingImages) {
      const url = page.url;
      // Assign arbitrary confidence scores if full/partial lists match
      const score = page.fullMatchingImages ? 0.99 : (page.partialMatchingImages ? 0.75 : 0.60);

      // Check if already in DB
      const exists = asset.detections.find((d: any) => d.infringingUrl === url);
      if (!exists && url) {
        await db.insert(detections).values({
          assetId: asset.id,
          infringingUrl: url,
          matchScore: score,
          status: "UNAUTHORIZED",
          screenshotUrl: null, // Hard to mock actual screenshots without a headless browser service
        });
        newDetectionsCount++;
      }
    }

    return NextResponse.json({ success: true, newDetections: newDetectionsCount });

  } catch (err: any) {
    console.error("Scan error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
