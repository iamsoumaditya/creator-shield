import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { assets } from "@/lib/db/schema";
import { syncUserToDatabase } from "@/lib/user-sync";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const syncedUser = await syncUserToDatabase(user);
    const userId = syncedUser.id;

    const body = await req.json();
    const {
      title,
      description,
      licenseType,
      tags,
      originalFilename,
      originalMimeType,
      originalPublicId,
      originalUrl,
      watermarkedPublicId,
      watermarkedUrl,
      pHash,
    } = body;

    if (!title || !originalUrl || !originalPublicId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert into Neon DB via Drizzle
    const [inserted] = await db.insert(assets).values({
      title,
      description: description || null,
      licenseType: licenseType || null,
      tags: tags || null,
      originalFilename: originalFilename || null,
      originalMimeType: originalMimeType || null,
      originalPublicId,
      originalUrl,
      watermarkedPublicId,
      watermarkedUrl,
      pHash,
      userId,
    }).returning();

    return NextResponse.json({ success: true, asset: inserted });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save asset";
    console.error("Asset registration error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
