import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { buildCloudinaryPublicId, getCloudinaryConfig, signCloudinaryParams } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename } = await req.json();
    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    const { cloudName, apiKey } = getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = buildCloudinaryPublicId(userId, "originals", filename);
    const signature = signCloudinaryParams({ public_id: publicId, timestamp });

    return NextResponse.json({
      cloudName,
      apiKey,
      timestamp,
      publicId,
      signature,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to sign upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
