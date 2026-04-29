import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { syncUserToDatabase } from "@/lib/user-sync";

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const profile = await syncUserToDatabase(user, {
      creatorType: readOptionalString(body.creatorType),
      portfolioUrl: readOptionalString(body.portfolioUrl),
      companyName: readOptionalString(body.companyName),
      websiteUrl: readOptionalString(body.websiteUrl),
      instagramHandle: readOptionalString(body.instagramHandle),
      xHandle: readOptionalString(body.xHandle),
      location: readOptionalString(body.location),
      bio: readOptionalString(body.bio),
    });

    return NextResponse.json({ success: true, profile });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
