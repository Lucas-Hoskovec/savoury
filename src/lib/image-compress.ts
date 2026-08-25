import sharp from "sharp";

export type CompressKind = "recipe" | "avatar" | "chat";
export type CompressedImage = { buffer: Buffer; mime: string; ext: string };

const TARGET_BYTES = 1024 * 1024;
const MAX_DIM: Record<CompressKind, number> = { recipe: 1600, avatar: 512, chat: 1200 };
const MIN_DIM: Record<CompressKind, number> = { recipe: 480, avatar: 192, chat: 480 };
const QUALITIES = [80, 65, 50, 40];

export async function compressImage(
  input: Buffer,
  kind: CompressKind,
  contentType: string,
): Promise<CompressedImage> {
  if (contentType === "image/gif" && input.length <= TARGET_BYTES) {
    return { buffer: input, mime: "image/gif", ext: "gif" };
  }

  const minDim = MIN_DIM[kind];
  for (let dim = MAX_DIM[kind]; dim >= minDim; dim = Math.max(minDim, Math.round(dim / 2))) {
    for (const quality of QUALITIES) {
      const buffer = await renderWebp(input, dim, quality);
      if (buffer.length <= TARGET_BYTES) {
        return { buffer, mime: "image/webp", ext: "webp" };
      }
    }
  }

  const buffer = await renderWebp(input, minDim, QUALITIES[QUALITIES.length - 1]);
  return { buffer, mime: "image/webp", ext: "webp" };
}

async function renderWebp(input: Buffer, maxDim: number, quality: number): Promise<Buffer> {
  const pipeline = sharp(input, { failOn: "none" }).rotate();
  const meta = await pipeline.metadata();
  const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
  if (longest > maxDim) {
    pipeline.resize({
      width: maxDim,
      height: maxDim,
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  return pipeline.webp({ quality, alphaQuality: 90, effort: 4 }).toBuffer();
}
