import { resolvePhotoUrl, type QuizAst } from '@silverio-labs/qmark-core';

const FETCH_TIMEOUT_MS = 15_000;
const MAX_PHOTO_BYTES = 20 * 1024 * 1024;

function isPng(buf: Buffer): boolean {
  return buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47;
}

function isJpeg(buf: Buffer): boolean {
  return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

async function fetchPhoto(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: 'image/png,image/jpeg,image/*;q=0.8' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const length = Number(response.headers.get('content-length') ?? 0);
  if (length > MAX_PHOTO_BYTES) {
    throw new Error(`larger than ${MAX_PHOTO_BYTES / 1024 / 1024} MB`);
  }
  const buf = Buffer.from(await response.arrayBuffer());
  // PDFKit can only embed PNG and JPEG.
  if (!isPng(buf) && !isJpeg(buf)) {
    throw new Error('unsupported format (PDF export supports PNG and JPEG)');
  }
  return buf;
}

/**
 * Downloads every publicly reachable question photo. Photos that fail are
 * reported via `onWarning` and omitted, so the PDF still renders.
 */
export async function prefetchPhotos(
  ast: QuizAst,
  onWarning: (message: string) => void = (m) => console.warn(m),
): Promise<Map<string, Buffer>> {
  const urls = new Set<string>();
  for (const section of ast.sections) {
    for (const question of section.questions) {
      const url = question.photo ? resolvePhotoUrl(question.photo) : undefined;
      if (url) urls.add(url);
    }
  }

  const photos = new Map<string, Buffer>();
  await Promise.all(
    [...urls].map(async (url) => {
      try {
        photos.set(url, await fetchPhoto(url));
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        onWarning(`Warning: skipping photo ${url}: ${reason}`);
      }
    }),
  );
  return photos;
}
