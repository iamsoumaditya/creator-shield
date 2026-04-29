import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assets, detections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { calculateHammingDistance, computeImagePHash } from "@/lib/watermark";

const PHASH_DISTANCE_THRESHOLD = 10;
const MAX_CANDIDATE_IMAGES_PER_PAGE = 3;

type VisionImageCandidate = {
  url?: string;
};

async function getVerifiedMatchScore(
  assetPHash: string | null,
  imageCandidates: VisionImageCandidate[] = []
) {
  if (!assetPHash || !imageCandidates.length) {
    return null;
  }

  let closestDistance: number | null = null;

  for (const candidate of imageCandidates.slice(0, MAX_CANDIDATE_IMAGES_PER_PAGE)) {
    if (!candidate.url) {
      continue;
    }

    try {
      const response = await fetch(candidate.url);
      if (!response.ok) {
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) {
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const candidatePHash = await computeImagePHash(buffer);
      const distance = calculateHammingDistance(assetPHash, candidatePHash);

      if (closestDistance === null || distance < closestDistance) {
        closestDistance = distance;
      }
    } catch (error) {
      console.warn("Candidate verification failed:", candidate.url, error);
    }
  }

  return closestDistance;
}

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

    const originalImageResponse = await fetch(asset.originalUrl);
    if (!originalImageResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch original asset from Cloudinary" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await originalImageResponse.arrayBuffer());
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
    let rejectedMatches = 0;

    for (const page of pagesWithMatchingImages) {
      const url = page.url;
      // Assign arbitrary confidence scores if full/partial lists match
      const score = page.fullMatchingImages ? 0.99 : (page.partialMatchingImages ? 0.75 : 0.60);
      const candidateImages = [
        ...(page.fullMatchingImages || []),
        ...(page.partialMatchingImages || []),
      ];
      const closestDistance = await getVerifiedMatchScore(asset.pHash, candidateImages);

      if (asset.pHash && (closestDistance === null || closestDistance > PHASH_DISTANCE_THRESHOLD)) {
        rejectedMatches++;
        continue;
      }

      // Check if already in DB
      const exists = asset.detections.find((d) => d.infringingUrl === url);
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

    return NextResponse.json({
      success: true,
      newDetections: newDetectionsCount,
      rejectedMatches,
      verification: {
        method: "vision-plus-phash",
        threshold: PHASH_DISTANCE_THRESHOLD,
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to scan asset";
    console.error("Scan error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
