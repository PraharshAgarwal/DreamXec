/**
 * Utility to reliably resolve avatar and profile picture URLs across development,
 * Vite proxy, and production deployments.
 */

import { getApiBaseUrl } from './apiConfig';

export interface AvatarOptions {
  shape?: 'circle' | 'badge';
  accessory?: string;
  mood?: string;
  seed?: string;
  animated?: boolean;
}

export function getAvatarUrl(
  url?: string | null,
  speciesSlug?: string | null,
  username?: string | null,
  options?: AvatarOptions
): string | undefined {
  let target = url;

  // Filter out obsolete external placeholder URLs so that the species avatar is used
  if (target && target.includes('unsplash.com')) {
    target = undefined;
  }

  // Derive species slug from username if slug is not directly passed
  // e.g. "vaquita_1" → "vaquita"
  let derivedSlug = speciesSlug;
  if (!derivedSlug && username) {
    const slugMatch = username.match(/^([a-z0-9_-]+?)(?:_\d+)?$/i);
    if (
      slugMatch &&
      slugMatch[1] &&
      !['user', 'student', 'admin', 'donor', 'mentor'].includes(slugMatch[1].toLowerCase())
    ) {
      derivedSlug = slugMatch[1].toLowerCase();
    }
  }

  const effectiveSeed = options?.seed || username || undefined;
  const requestedShape = options?.shape || 'circle';

  if (!target && derivedSlug) {
    target = `/api/species/${derivedSlug}/avatar.svg`;
  }

  if (!target) return undefined;

  // Append query params if targeting a species avatar SVG endpoint
  if (target.includes('/api/species/')) {
    const urlObj = target.startsWith('http') ? new URL(target) : new URL(target, 'http://localhost');
    
    if (!urlObj.searchParams.has('shape')) {
      urlObj.searchParams.set('shape', requestedShape);
    } else if (options?.shape) {
      urlObj.searchParams.set('shape', options.shape);
    }

    if (options?.accessory && options.accessory !== 'none') {
      urlObj.searchParams.set('accessory', options.accessory);
    }
    if (options?.mood) {
      urlObj.searchParams.set('mood', options.mood);
    }
    if (effectiveSeed && !urlObj.searchParams.has('seed')) {
      urlObj.searchParams.set('seed', effectiveSeed);
    }
    if (options?.animated !== undefined) {
      urlObj.searchParams.set('animated', options.animated ? 'true' : 'false');
    }

    target = target.startsWith('http') ? urlObj.toString() : `${urlObj.pathname}${urlObj.search}`;
  }

  // If already absolute or data URI, return as-is
  if (
    target.startsWith('http://') ||
    target.startsWith('https://') ||
    target.startsWith('data:')
  ) {
    return target;
  }

  // If relative path starting with /, resolve against backend server origin
  if (target.startsWith('/')) {
    // In live browser (e.g. dreamxec.com), root-relative paths like /api/species/...
    // resolve natively against the current origin without needing origin prefixing.
    if (
      typeof window !== 'undefined' &&
      window.location &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      return target;
    }

    const apiBase = getApiBaseUrl();
    const origin = apiBase.replace(/\/api\/?$/, '');
    return `${origin}${target}`;
  }

  return target;
}
