// ─── Common Utilities ─────────────────────────────────────────────
// Shared helper functions used across the entire backend.
// Keep this file lean – only truly cross-cutting concerns belong here.

import { createHash, randomBytes, createHmac } from 'crypto';
import { customAlphabet } from 'nanoid';

// ─── Slug / ID Generation ───

const SLUG_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Generate a short, URL-safe slug (default 7 chars). */
export const generateSlug = customAlphabet(SLUG_ALPHABET, 7);

/** Generate a cryptographically-random token (hex). */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

// ─── Hashing ───

/** SHA-256 hash a plain string (for API keys, etc.). */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/** HMAC-SHA256 for webhook signing. */
export function hmacSha256(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

// ─── IP Utilities ───

/** Anonymize IP for GDPR – truncate last octet (IPv4) or last 80 bits (IPv6). */
export function anonymizeIp(ip: string): string {
  if (ip.includes('.')) {
    // IPv4: 192.168.1.42 → 192.168.1.0
    const parts = ip.split('.');
    parts[3] = '0';
    return parts.join('.');
  }
  // IPv6: truncate last 5 groups
  const parts = ip.split(':');
  return parts.slice(0, 3).join(':') + '::';
}

/** Extract real client IP from proxy headers. */
export function extractClientIp(req: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return first.trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }
  return req.ip || req.socket?.remoteAddress || '0.0.0.0';
}

// ─── URL / UTM Parsing ───

export interface UtmParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
}

/** Extract UTM parameters from a URL or query string. */
export function parseUtmParams(url: string): UtmParams {
  try {
    const parsed = new URL(url, 'http://localhost');
    return {
      utm_source: parsed.searchParams.get('utm_source') || '',
      utm_medium: parsed.searchParams.get('utm_medium') || '',
      utm_campaign: parsed.searchParams.get('utm_campaign') || '',
      utm_term: parsed.searchParams.get('utm_term') || '',
      utm_content: parsed.searchParams.get('utm_content') || '',
    };
  } catch {
    return { utm_source: '', utm_medium: '', utm_campaign: '', utm_term: '', utm_content: '' };
  }
}

// ─── Date Helpers ───

/** Check if a date is in the past. */
export function isExpired(date: Date | null | undefined): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

/** Check if a date is in the future (for activation scheduling). */
export function isNotYetActive(date: Date | null | undefined): boolean {
  if (!date) return false;
  return new Date(date) > new Date();
}

// ─── Response Formatting ───

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Build a standard paginated response. */
export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Validation Helpers ───

/** Check if a string is a valid URL. */
export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/** Sanitize a workspace slug (lowercase, alphanumeric + hyphens). */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
