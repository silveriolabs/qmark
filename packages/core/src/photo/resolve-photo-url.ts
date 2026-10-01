import type { PhotoAnchor } from '../ast/types';

export const DEFAULT_PHOTO_ANCHOR: PhotoAnchor = 'right';

const S3_URI = /^s3:\/\/([^/]+)\/(.+)$/i;

function encodeKey(key: string): string {
  return key
    .split('/')
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join('/');
}

/**
 * Resolves a `photo` value to an absolute, publicly fetchable https/http URL.
 *
 * Accepts:
 * - `https://…` / `http://…`
 * - protocol-relative `//host/path` (resolved to https)
 * - `s3://bucket/key` (virtual-hosted S3 URL; bucket must allow public reads)
 *
 * Returns `undefined` when the value cannot be resolved.
 */
export function resolvePhotoUrl(photo: string): string | undefined {
  const value = photo.trim();
  if (!value) return undefined;

  const s3 = S3_URI.exec(value);
  if (s3) {
    const [, bucket, key] = s3;
    // Buckets with dots break TLS on virtual-hosted URLs; fall back to path-style.
    return bucket!.includes('.')
      ? `https://s3.amazonaws.com/${bucket}/${encodeKey(key!)}`
      : `https://${bucket}.s3.amazonaws.com/${encodeKey(key!)}`;
  }

  const candidate = value.startsWith('//') ? `https:${value}` : value;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

export function isSupportedPhotoUrl(photo: string): boolean {
  return resolvePhotoUrl(photo) !== undefined;
}
