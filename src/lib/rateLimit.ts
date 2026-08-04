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

export function clientKey(request: Request, extra = ""): string {
  const fwd = request.headers.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0].trim() : request.headers.get("x-real-ip")) || "unknown";
  return `${ip}${extra ? `:${extra}` : ""}`;
}

export async function getWindowStartTime() {
  return getWindowStart();
}
