import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { syncUserToDatabase } from "@/lib/user-sync";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const syncedUser = await syncUserToDatabase(user);
    const userId = syncedUser.id;
    const { id } = await params;
    const asset = await db.query.assets.findFirst({
      where: eq(assets.id, id),
      with: { detections: true }
    });

    if (!asset || asset.userId !== userId) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ asset });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load asset";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
