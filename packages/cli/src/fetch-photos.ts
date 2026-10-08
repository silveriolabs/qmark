import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isLocalPhotoPath, photoLookupKey, resolvePhotoUrl, type QuizAst } from '@silverio-labs/qmark-core';

const FETCH_TIMEOUT_MS = 15_000;
const MAX_PHOTO_BYTES = 20 * 1024 * 1024;

function isPng(buf: Buffer): boolean {
  return buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47;
}

function isJpeg(buf: Buffer): boolean {
  return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

/** AVIF is an ISO BMFF file whose major brand is `avif` or `avis`. */
function isAvif(buf: Buffer): boolean {
  if (buf.length < 12 || buf.toString('ascii', 4, 8) !== 'ftyp') return false;
  const brand = buf.toString('ascii', 8, 12);
  return brand === 'avif' || brand === 'avis';
}

/** WebP is a RIFF container whose form type is `WEBP`. */
function isWebp(buf: Buffer): boolean {
  return (
    buf.length > 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  );
}

const UNSUPPORTED = 'unsupported format (use PNG, JPG, JPEG, WEBP, or AVIF)';

/**
 * PNG and JPEG pass through. WebP and AVIF are decoded to PNG so PDFKit can embed them;
 * HTML and SVG then use that PNG as well.
 */
async function normalizeImage(buf: Buffer): Promise<Buffer> {
  if (isPng(buf) || isJpeg(buf)) return buf;
  if (!isAvif(buf) && !isWebp(buf)) throw new Error(UNSUPPORTED);
  const { default: sharp } = await import('sharp');
  return sharp(buf).png().toBuffer();
}

async function fetchPhoto(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: 'image/png,image/jpeg,image/webp,image/avif,image/*;q=0.8' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const length = Number(response.headers.get('content-length') ?? 0);
  if (length > MAX_PHOTO_BYTES) {
    throw new Error(`larger than ${MAX_PHOTO_BYTES / 1024 / 1024} MB`);
  }
  const buf = Buffer.from(await response.arrayBuffer());
  return normalizeImage(buf);
}

/** Data URI for an embedded PNG or JPEG (SVG and HTML). AVIF is already PNG here. */
export function photoDataUri(buf: Buffer): string {
  const mime = isPng(buf) ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function readLocalPhoto(photo: string, baseDir: string): Promise<Buffer> {
  const value = photo.trim();
  const filePath = /^file:/i.test(value)
    ? fileURLToPath(value)
    : isAbsolute(value)
      ? value
      : resolve(baseDir, value);
  const buf = readFileSync(filePath);
  if (buf.length > MAX_PHOTO_BYTES) {
    throw new Error(`larger than ${MAX_PHOTO_BYTES / 1024 / 1024} MB`);
  }
  return normalizeImage(buf);
}

export interface PrefetchPhotosOptions {
  /** Directory that relative photo paths are resolved from. */
  baseDir?: string;
  onWarning?: (message: string) => void;
}

/**
 * Loads every question photo: remote URLs are downloaded, local paths are read
 * from disk. Photos that fail are reported via `onWarning` and omitted.
 */
export async function prefetchPhotos(
  ast: QuizAst,
  options: PrefetchPhotosOptions = {},
): Promise<Map<string, Buffer>> {
  const onWarning = options.onWarning ?? ((m) => console.warn(m));
  const baseDir = options.baseDir ?? process.cwd();
  const keys = new Set<string>();
  for (const section of ast.sections) {
    for (const question of section.questions) {
      const key = question.photo ? photoLookupKey(question.photo) : undefined;
      if (key) keys.add(key);
    }
  }

  const photos = new Map<string, Buffer>();
  await Promise.all(
    [...keys].map(async (key) => {
      try {
        const remote = resolvePhotoUrl(key);
        const buf =
          remote && !isLocalPhotoPath(key)
            ? await fetchPhoto(remote)
            : await readLocalPhoto(key, baseDir);
        photos.set(key, buf);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        onWarning(`Warning: skipping photo ${key}: ${reason}`);
      }
    }),
  );
  return photos;
}
