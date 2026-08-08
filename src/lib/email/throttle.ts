/**
 * In-process email send throttle.
 * PurelyMail throttles the sender (450 4.3.2) when we burst too fast, so we
 * rate-limit sends per process and queue the rest. Per-process is fine here
 * because the app runs a single Next.js container.
 */

const MAX_PER_MINUTE = 10;
const MAX_PER_HOUR = 240;
const WINDOW_MIN_MS = 60 * 1000;
const WINDOW_HOUR_MS = 60 * 60 * 1000;

const recentSends: number[] = [];
let hourCount = 0;
let hourWindowStart = Date.now();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Acquire a send slot, waiting until we are under the per-minute and per-hour caps. */
export async function acquireSendSlot(): Promise<void> {
  for (;;) {
    const now = Date.now();

    // Rolling hour window.
    if (now - hourWindowStart > WINDOW_HOUR_MS) {
      hourCount = 0;
      hourWindowStart = now;
    }
    while (recentSends.length && now - recentSends[0] > WINDOW_MIN_MS) recentSends.shift();

    if (recentSends.length < MAX_PER_MINUTE && hourCount < MAX_PER_HOUR) break;

    // Back off a short moment before retrying the slot check.
    await sleep(500);
  }

  recentSends.push(Date.now());
  hourCount++;
}

export function resetSendThrottleForTests() {
  recentSends.length = 0;
  hourCount = 0;
  hourWindowStart = Date.now();
}
