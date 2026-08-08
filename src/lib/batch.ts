const DEFAULT_CONCURRENCY = 4;

export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const idx = cursor;
      cursor++;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch {
        results[idx] = undefined as unknown as R;
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length || 1) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function sendEmailsInBatches<T>(
  items: T[],
  fn: (item: T) => Promise<unknown>,
  concurrency = DEFAULT_CONCURRENCY
): Promise<number> {
  let sent = 0;
  await mapLimit(items, concurrency, async (item) => {
    const r = await fn(item);
    if (r !== false) sent++;
  });
  return sent;
}
