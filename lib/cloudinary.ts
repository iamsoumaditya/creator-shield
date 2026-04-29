import crypto from "crypto";

type SignatureParams = Record<string, string | number | boolean | undefined | null>;

type UploadedAsset = {
  publicId: string;
  secureUrl: string;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getCloudinaryConfig() {
  return {
    cloudName: requireEnv("CLOUDINARY_CLOUD_NAME"),
    apiKey: requireEnv("CLOUDINARY_API_KEY"),
    apiSecret: requireEnv("CLOUDINARY_API_SECRET"),
  };
}

export function sanitizeFileBasename(filename: string) {
  return filename
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "asset";
}

export function buildCloudinaryPublicId(userId: string, kind: "originals" | "watermarked", filename: string) {
  const baseName = sanitizeFileBasename(filename);
  return `creatorshield/${userId}/${kind}/${Date.now()}-${baseName}`;
}

export function buildCloudinaryDeliveryUrl(publicId: string, transformation = "f_auto") {
  const { cloudName } = getCloudinaryConfig();
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
}

export function signCloudinaryParams(params: SignatureParams) {
  const { apiSecret } = getCloudinaryConfig();
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  publicId: string,
  mimeType = "image/png"
): Promise<UploadedAsset> {
  const { cloudName, apiKey } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signCloudinaryParams({ public_id: publicId, timestamp });

  const formData = new FormData();
  formData.append("file", new Blob([buffer], { type: mimeType }));
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("public_id", publicId);
  formData.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Cloudinary upload failed");
  }

  return {
    publicId: data.public_id,
    secureUrl: data.secure_url,
  };
}
