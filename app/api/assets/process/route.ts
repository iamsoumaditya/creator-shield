import { NextRequest, NextResponse } from "next/server";
import { processImageAndWatermark } from "@/lib/watermark";
import fs from "fs/promises";
import path from "path";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { watermarkedBuffer, pHash } = await processImageAndWatermark(buffer, userId);

    // Ensure uploads dir exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // In a real app we might want a unique filename based on time or UUID
    const filename = `wm_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadsDir, filename);

    // Save watermarked file
    await fs.writeFile(filePath, watermarkedBuffer);

    // Save original file as well
    const originalFilename = `orig_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    await fs.writeFile(path.join(uploadsDir, originalFilename), buffer);

    return NextResponse.json({
      watermarkedUrl: `/uploads/${filename}`,
      originalUrl: `/uploads/${originalFilename}`,
      pHash
    });
  } catch (error: any) {
    console.error("Asset processing error:", error);
    return NextResponse.json({ error: error.message || "Failed to process image" }, { status: 500 });
  }
}
