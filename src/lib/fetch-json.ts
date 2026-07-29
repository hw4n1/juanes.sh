/**
 * Build-time JSON fetch.
 *
 * Golden rule: this runs during `astro build` in Cloudflare's builder.
 * If a third-party API is down or slow, the build must NOT break. So this
 * always returns `null` instead of throwing, and the calling component
 * decides what to render in that case.
 */
export interface FetchJsonOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export async function fetchJson<T>(
  url: string,
  { timeoutMs = 8000, headers = {} }: FetchJsonOptions = {},
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Courtesy to public APIs: identify yourself and leave a way to be reached.
        'user-agent': 'juanes.sh build (+https://juanes.sh)',
        accept: 'application/json',
        ...headers,
      },
    });

    if (!res.ok) {
      console.warn(`[fetch-json] ${url} -> HTTP ${res.status}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[fetch-json] ${url} failed:`, err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
