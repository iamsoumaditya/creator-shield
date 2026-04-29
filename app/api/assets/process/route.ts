import { NextRequest, NextResponse } from "next/server";
import { processImageAndWatermark } from "@/lib/watermark";
import { auth } from "@clerk/nextjs/server";
import { buildCloudinaryDeliveryUrl, buildCloudinaryPublicId, uploadBufferToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { originalUrl, originalPublicId, filename } = body;
    if (!originalUrl || !originalPublicId || !filename) {
      return NextResponse.json({ error: "Missing upload payload" }, { status: 400 });
    }

    const originalRasterUrl = buildCloudinaryDeliveryUrl(originalPublicId, "f_png");
    const originalResponse = await fetch(originalRasterUrl);
    if (!originalResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch uploaded image" }, { status: 400 });
    }

    const arrayBuffer = await originalResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { watermarkedBuffer, pHash } = await processImageAndWatermark(buffer, userId);
    const watermarkedPublicId = buildCloudinaryPublicId(userId, "watermarked", filename);
    const uploadedWatermarked = await uploadBufferToCloudinary(watermarkedBuffer, watermarkedPublicId);

    return NextResponse.json({
      originalUrl,
      originalPublicId,
      watermarkedUrl: uploadedWatermarked.secureUrl,
      watermarkedPublicId: uploadedWatermarked.publicId,
      pHash,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process image";
    console.error("Asset processing error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
