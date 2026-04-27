import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { detections, takedownNotices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

function chunkText(text: string, size = 180) {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const { detectionId, platform } = body;

    const detection = await db.query.detections.findFirst({
      where: eq(detections.id, detectionId),
      with: { asset: true }
    });

    if (!detection || detection.asset.userId !== userId) {
      return new Response("Not found or unauthorized", { status: 404 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return new Response("Gemini API key is not configured.", { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const prompt = `System: "You are a legal assistant specializing in digital copyright and DMCA takedown notices."
User: "Draft a formal DMCA takedown notice for the following:
- Rights holder: ${userId}
- Original work: ${detection.asset.title}, registered on ${detection.asset.createdAt.toISOString().split("T")[0]}
- Original URL: ${detection.asset.originalUrl}  
- Infringing URL: ${detection.infringingUrl}
- Platform: ${platform}
Format it as a complete, ready-to-send notice with all required DMCA sections. Be formal and legally precise."`;

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
