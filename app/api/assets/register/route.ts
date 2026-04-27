import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { assets, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;

    // Ensure user exists in our database to satisfy foreign key constraints
    await db.insert(users).values({
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
      email: user.emailAddresses[0]?.emailAddress || '',
    }).onConflictDoNothing();

    const body = await req.json();
    const { title, description, licenseType, tags, originalUrl, watermarkedUrl, pHash } = body;

    if (!title || !originalUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert into Neon DB via Drizzle
    const [inserted] = await db.insert(assets).values({
      title,
      description: description || null,
      originalUrl,
      watermarkedUrl,
      pHash,
      userId,
    }).returning();

    return NextResponse.json({ success: true, asset: inserted });
  } catch (error: any) {
    console.error("Asset registration error:", error);
    return NextResponse.json({ error: error.message || "Failed to save asset" }, { status: 500 });
  }
}
