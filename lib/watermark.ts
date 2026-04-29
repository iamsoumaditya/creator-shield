import { Jimp } from 'jimp';
import { intToRGBA, rgbaToInt } from '@jimp/utils';

/**
 * Computes a simple perceptual hash (Average Hash) for the image
 * Resizes to 8x8, converts to greyscale, computes average, and returns a 64-bit hex string.
 */
async function computeHash(image: any): Promise<string> {
  const clone = image.clone();
  clone.resize({ w: 8, h: 8 }).greyscale();
  
  let total = 0;
  const pixels: number[] = [];
  
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const color = clone.getPixelColor(x, y);
      const { r, g, b } = intToRGBA(color);
      const gray = Math.floor((r + g + b) / 3);
      pixels.push(gray);
      total += gray;
    }
  }
  
  const mean = total / 64;
  let binaryString = '';
  for (let i = 0; i < 64; i++) {
    binaryString += pixels[i] > mean ? '1' : '0';
  }
  
  // Convert binary to hex
  let hexStr = '';
  for (let i = 0; i < 64; i += 4) {
    const chunk = binaryString.substring(i, i + 4);
    hexStr += parseInt(chunk, 2).toString(16);
  }
  
  return hexStr;
}

export async function computeImagePHash(buffer: Buffer): Promise<string> {
  const image = await Jimp.read(buffer);
  return computeHash(image);
}

export function calculateHammingDistance(hashA: string, hashB: string): number {
  if (hashA.length !== hashB.length) {
    throw new Error("Hashes must have the same length");
  }

  let distance = 0;

  for (let index = 0; index < hashA.length; index++) {
    const valueA = parseInt(hashA[index], 16);
    const valueB = parseInt(hashB[index], 16);
    const xor = valueA ^ valueB;

    distance += xor.toString(2).replace(/0/g, "").length;
  }

  return distance;
}

/**
 * Embeds data into the LSB of the blue channel of the top-left 32x32 pixels
 */
async function embedWatermark(image: any, dataString: string) {
  // Convert string to binary array
  const binaryData: number[] = [];
  const encoded = Buffer.from(dataString, 'utf-8');
  for (const byte of encoded) {
    for (let i = 7; i >= 0; i--) {
      binaryData.push((byte >> i) & 1);
    }
  }
  
  // Need to ensure we terminate, we can pad with zeros
  while (binaryData.length < 32 * 32) {
    binaryData.push(0);
  }

  let dataIndex = 0;
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      if (dataIndex >= binaryData.length) break;
      
      const color = image.getPixelColor(x, y);
      const rgba = intToRGBA(color);
      
      // Modify LSB of blue channel
      const bit = binaryData[dataIndex++];
      rgba.b = (rgba.b & 0xFE) | bit;
      
      const newColor = rgbaToInt(rgba.r, rgba.g, rgba.b, rgba.a);
      image.setPixelColor(newColor, x, y);
    }
  }
  return image;
}

export async function processImageAndWatermark(buffer: Buffer, creatorId: string): Promise<{ watermarkedBuffer: Buffer, pHash: string }> {
  const image = await Jimp.read(buffer);
  
  const pHash = await computeHash(image);
  
  const timestamp = Date.now().toString();
  const payload = `${creatorId}|${timestamp}`;
  
  const watermarkedImage = await embedWatermark(image, payload);
  const watermarkedBuffer = await watermarkedImage.getBuffer("image/png");
  
  return { watermarkedBuffer, pHash };
}
