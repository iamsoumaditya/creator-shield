import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

type ProfileOverrides = {
  creatorType?: string | null;
  portfolioUrl?: string | null;
  companyName?: string | null;
  websiteUrl?: string | null;
  instagramHandle?: string | null;
  xHandle?: string | null;
  location?: string | null;
  bio?: string | null;
};

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function syncUserToDatabase(user: ClerkUser, overrides: ProfileOverrides = {}) {
  const metadata = user.unsafeMetadata ?? {};
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  const payload = {
    id: user.id,
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown User",
    email: user.emailAddresses[0]?.emailAddress || "",
    creatorType: overrides.creatorType ?? normalizeString(metadata.creatorType) ?? existingUser?.creatorType ?? null,
    portfolioUrl: overrides.portfolioUrl ?? normalizeString(metadata.portfolioUrl) ?? existingUser?.portfolioUrl ?? null,
    companyName: overrides.companyName ?? normalizeString(metadata.companyName) ?? existingUser?.companyName ?? null,
    websiteUrl: overrides.websiteUrl ?? normalizeString(metadata.websiteUrl) ?? existingUser?.websiteUrl ?? null,
    instagramHandle: overrides.instagramHandle ?? normalizeString(metadata.instagramHandle) ?? existingUser?.instagramHandle ?? null,
    xHandle: overrides.xHandle ?? normalizeString(metadata.xHandle) ?? existingUser?.xHandle ?? null,
    location: overrides.location ?? normalizeString(metadata.location) ?? existingUser?.location ?? null,
    bio: overrides.bio ?? normalizeString(metadata.bio) ?? existingUser?.bio ?? null,
  };

  await db
    .insert(users)
    .values(payload)
    .onConflictDoUpdate({
      target: users.id,
      set: {
        name: payload.name,
        email: payload.email,
        creatorType: payload.creatorType,
        portfolioUrl: payload.portfolioUrl,
        companyName: payload.companyName,
        websiteUrl: payload.websiteUrl,
        instagramHandle: payload.instagramHandle,
        xHandle: payload.xHandle,
        location: payload.location,
        bio: payload.bio,
      },
    });

  return payload;
}
