import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB (Vercel admite hasta 4,5 MB por request)
export const MAX_IMAGES_PER_PRODUCT = 8;

const TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;

/** Verifica por los primeros bytes que el archivo sea realmente una imagen (no basta con la extensión) */
function sniff(bytes: Uint8Array): keyof typeof TYPES | null {
  const hex = (start: number, len: number) => Buffer.from(bytes.subarray(start, start + len)).toString("hex");
  const ascii = (start: number, len: number) => Buffer.from(bytes.subarray(start, start + len)).toString("ascii");
  if (hex(0, 3) === "ffd8ff") return "image/jpeg";
  if (hex(0, 8) === "89504e470d0a1a0a") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return "image/webp";
  if (ascii(4, 4) === "ftyp" && ["avif", "avis"].includes(ascii(8, 4))) return "image/avif";
  return null;
}

export class UploadError extends Error {}

/**
 * Guarda una imagen y devuelve su URL pública.
 * - Con BLOB_READ_WRITE_TOKEN (Vercel): la sube a Vercel Blob.
 * - Sin token (desarrollo / Codespaces): la guarda en public/uploads.
 */
export async function saveImage(file: File) {
  if (file.size === 0) throw new UploadError("El archivo está vacío");
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError(`“${file.name}” pesa más de 4 MB`);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type) throw new UploadError(`“${file.name}” no es una imagen JPG, PNG, WEBP o AVIF`);
  const name = `productos/${randomUUID()}.${TYPES[type]}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(name, Buffer.from(bytes), { access: "public", contentType: type });
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new UploadError("Falta conectar Vercel Blob al proyecto (variable BLOB_READ_WRITE_TOKEN)");
  }
  const dir = path.join(process.cwd(), "public", "uploads", "productos");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, path.basename(name)), bytes);
  return `/uploads/${name}`;
}
