import { prisma } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;

async function getWindowStart(): Promise<string> {
  return new Date(Date.now() - WINDOW_MS).toISOString();
}

/** Simple per-IP + per-key sliding window limiter backed by the Setting table. */
export async function checkRateLimit(
  key: string,
  max: number
): Promise<{ allowed: boolean; retryAfterSec?: number; remaining?: number }> {
  const bucketKey = `ratelimit:${key}`;
  const existing = await prisma.setting.findUnique({ where: { key: bucketKey } });

  const now = Date.now();
  const windowStart = new Date(now - WINDOW_MS).getTime();

  let timestamps: number[] = [];
  if (existing?.value) {
    try {
      timestamps = JSON.parse(existing.value);
    } catch {
      timestamps = [];
    }
  }

  timestamps = timestamps.filter((t) => t > windowStart);

  if (timestamps.length >= max) {
    const oldest = timestamps[0];
    const retryAfterSec = Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  timestamps.push(now);
  await prisma.setting.upsert({
    where: { key: bucketKey },
    update: { value: JSON.stringify(timestamps.slice(-max)) },
    create: { key: bucketKey, value: JSON.stringify(timestamps.slice(-max)) },
  });

  return { allowed: true, remaining: Math.max(0, max - timestamps.length) };
}

export async function clearRateLimit(key: string) {
  const bucketKey = `ratelimit:${key}`;
  await prisma.setting.upsert({
    where: { key: bucketKey },
    update: { value: "[]" },
    create: { key: bucketKey, value: "[]" },
  });
}

/**
 * Per-email attempt tracking backed by the Setting table.
 * Counts attempts (optionally only failures) within `windowMs` and blocks after `max`.
 */
async function readTimestamps(bucketKey: string): Promise<number[]> {
  const existing = await prisma.setting.findUnique({ where: { key: bucketKey } });
  if (!existing?.value) return [];
  try {
    return JSON.parse(existing.value);
  } catch {
    return [];
  }
}

async function writeTimestamps(bucketKey: string, timestamps: number[]) {
  await prisma.setting.upsert({
    where: { key: bucketKey },
    update: { value: JSON.stringify(timestamps) },
    create: { key: bucketKey, value: JSON.stringify(timestamps) },
  });
}

function emailKey(email: string, scope: string): string {
  return `emlimit:${scope}:${email.trim().toLowerCase()}`;
}

/** Record one attempt (e.g. a failed login). Prunes entries older than windowMs. */
export async function recordEmailAttempt(email: string, scope: string, windowMs: number) {
  const bucketKey = emailKey(email, scope);
  const now = Date.now();
  const timestamps = (await readTimestamps(bucketKey)).filter((t) => t > now - windowMs);
  timestamps.push(now);
  await writeTimestamps(bucketKey, timestamps.slice(-50));
}

/** Read-only: is this email currently blocked for `scope`? Returns retry-after seconds. */
export async function isEmailBlocked(
  email: string,
  scope: string,
  max: number,
  windowMs: number
): Promise<{ blocked: boolean; retryAfterSec?: number }> {
  const bucketKey = emailKey(email, scope);
  const now = Date.now();
  const timestamps = (await readTimestamps(bucketKey)).filter((t) => t > now - windowMs);
  if (timestamps.length >= max) {
    const oldest = timestamps[0];
    return { blocked: true, retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
  }
  return { blocked: false };
}

/** Check-and-record for email-scoped request limits (register, forgot-password). */
export async function checkEmailLimit(
  email: string,
  scope: string,
  max: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  const blocked = await isEmailBlocked(email, scope, max, windowMs);
  if (blocked.blocked) return { allowed: false, retryAfterSec: blocked.retryAfterSec };
  await recordEmailAttempt(email, scope, windowMs);
  return { allowed: true };
}

/** Reset the attempt counter for an email + scope (e.g. on a successful login). */
export async function clearEmailLimit(email: string, scope: string) {
  await prisma.setting.upsert({
    where: { key: emailKey(email, scope) },
    update: { value: "[]" },
    create: { key: emailKey(email, scope), value: "[]" },
  });
}

export function clientKey(request: Request, extra = ""): string {
  const fwd = request.headers.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0].trim() : request.headers.get("x-real-ip")) || "unknown";
  return `${ip}${extra ? `:${extra}` : ""}`;
}

export async function getWindowStartTime() {
  return getWindowStart();
}
