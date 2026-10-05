export const PHOTO_DATA_URL_PATTERN = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
export const MAX_PHOTO_DATA_URL_LENGTH = 400_000;

export function normalizePhotoDataUrl(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_PHOTO_DATA_URL_LENGTH || !PHOTO_DATA_URL_PATTERN.test(trimmed)) {
    throw new Error("Photo invalide. Utilise une image PNG, JPEG ou WebP (max. ~300 Ko).");
  }
  return trimmed;
}
