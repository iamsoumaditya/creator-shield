import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { detections, takedownNotices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
     const { userId } = await auth();
     const { id } = await params;
     
     if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     
     // Note: Real app should verify this detection indeed belongs to `userId` via relation
     await db.update(detections).set({ status: "RESOLVED" }).where(eq(detections.id, id));
     
     await db.update(takedownNotices)
       .set({ status: "SENT", sentAt: new Date() })
       .where(eq(takedownNotices.detectionId, id));
     
     return NextResponse.json({ success: true });
  } catch (err: any) {
     return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
