import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { detections, takedownNotices, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { syncUserToDatabase } from "@/lib/user-sync";

function chunkText(text: string, size = 180) {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const syncedUser = await syncUserToDatabase(user);
    const userId = user.id;

    const body = await req.json();
    const { detectionId, platform } = body;

    const detection = await db.query.detections.findFirst({
      where: eq(detections.id, detectionId),
      with: { asset: true }
    });

    if (!detection || detection.asset.userId !== userId) {
      return new Response("Not found or unauthorized", { status: 404 });
    }

    const profile = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!process.env.GEMINI_API_KEY) {
      return new Response("Gemini API key is not configured.", { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const rightsHolder = profile ?? syncedUser;
    const prompt = `
You are a senior copyright enforcement specialist and legal communications writer.
Write a polished, production-ready takedown email that can be sent immediately with no manual editing.

Requirements:
- Output only the finished email draft.
- Include a clear subject line on the first line in the form: **Subject:** ...
- Use markdown-style bold for section labels such as **Subject:**, **To:**, **From:** when helpful.
- Personalize the message with the rights holder's real details below.
- The email must read like a human professional wrote it, not a template.
- Do not use placeholders like [NAME], [EMAIL], [DATE], or similar.
- If a field is missing, simply omit or gracefully work around it.
- Address the platform or recipient team naturally for ${platform}.
- State ownership, identify the infringing URL, reference the original work, request removal/disablement, include good-faith and accuracy statements, and provide a direct signature block.
- Keep the tone formal, confident, and concise enough to send as an actual email.

Rights holder details:
- Full name: ${rightsHolder.name}
- Email: ${rightsHolder.email}
- Creator type: ${rightsHolder.creatorType ?? "Not provided"}
- Company or studio: ${rightsHolder.companyName ?? "Not provided"}
- Website: ${rightsHolder.websiteUrl ?? "Not provided"}
- Portfolio: ${rightsHolder.portfolioUrl ?? "Not provided"}
- Instagram: ${rightsHolder.instagramHandle ?? "Not provided"}
- X handle: ${rightsHolder.xHandle ?? "Not provided"}
- Location: ${rightsHolder.location ?? "Not provided"}
- Bio: ${rightsHolder.bio ?? "Not provided"}

Asset details:
- Title: ${detection.asset.title}
- Description: ${detection.asset.description ?? "Not provided"}
- License: ${detection.asset.licenseType ?? "Not provided"}
- Tags: ${detection.asset.tags ?? "Not provided"}
- Registered on: ${detection.asset.createdAt.toISOString().split("T")[0]}
- Original URL: ${detection.asset.originalUrl}
- Public watermark hash: ${detection.asset.pHash ?? "Not provided"}

Infringement details:
- Platform: ${platform}
- Infringing URL: ${detection.infringingUrl}
- Match score: ${Math.round(detection.matchScore * 100)}%

Return a complete ready-to-send email only.
`.trim();

    const model = genAI.getGenerativeModel({ model: modelName });
    const generationResp = await model.generateContent(prompt);
    const fullDraft = generationResp.response.text();

    await db.insert(takedownNotices).values({
      detectionId: detection.id,
      platform,
      draftText: fullDraft,
      status: "DRAFT"
    });

    if (detection.status === "UNAUTHORIZED") {
      await db.update(detections).set({ status: "REVIEWING" }).where(eq(detections.id, detection.id));
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const encoder = new TextEncoder();
          for (const chunk of chunkText(fullDraft)) {
             controller.enqueue(encoder.encode(chunk));
          }
        } catch (e) {
          console.error(e);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });

  } catch (err: unknown) {
    console.error("Gemini error:", err);

    const message = err instanceof Error ? err.message : "Unknown Gemini error";
    if (message.includes("is not found for API version") || message.includes("[404 Not Found]")) {
      return new Response(
        `The configured Gemini model is unavailable. Set GEMINI_MODEL to a currently supported model such as gemini-2.5-flash.`,
        { status: 500 }
      );
    }

    return new Response(message, { status: 500 });
  }
}
