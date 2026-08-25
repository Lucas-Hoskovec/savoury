const TARGET_BYTES = 1024 * 1024;

export type CompressedFile = { blob: Blob; name: string };

export async function compressImageClient(file: File, maxDim: number): Promise<CompressedFile> {
  if (file.size <= TARGET_BYTES) {
    return { blob: file, name: file.name };
  }

  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, maxDim / longest);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Compression impossible");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob = await canvasToWebp(canvas, 0.8);
  if (blob.size > TARGET_BYTES) blob = await canvasToWebp(canvas, 0.6);
  if (blob.size > TARGET_BYTES) blob = await canvasToWebp(canvas, 0.4);

  return { blob, name: webpName(file.name) };
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Compression impossible"))),
      "image/webp",
      quality,
    );
  });
}

function webpName(name: string): string {
  const base = name.replace(/\.[^/.]+$/, "");
  return `${base || "image"}.webp`;
}
