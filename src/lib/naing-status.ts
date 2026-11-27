/**
 * Build-time snapshot of the public services in the home rack, read from the
 * same JSON that powers https://status.naing.co (a Prometheus instant-query
 * response with `public:*` recording rules).
 *
 * The live page refreshes every minute; this snapshot is frozen at build time
 * (the site rebuilds daily), so the UI always points to the live page.
 */
import { fetchJson } from './fetch-json';

export const STATUS_URL = 'https://status.naing.co';
const DATA_URL = 'https://data.naing.co/public.json';

type State = 'ok' | 'warn' | 'down' | 'unknown';

export interface RackService {
  id: string;
  name: string;
  /** Short state label, e.g. "up to date", "running". */
  stateText: string;
  state: State;
  /** One-line facts, already formatted. */
  facts: string[];
}

export interface RackSnapshot {
  takenAt: Date;
  services: RackService[];
  mirrorsTotal: { requests: number | null; bytes: number | null; countries: number | null };
}

interface PromVector {
  status?: string;
  data?: { result?: { metric: Record<string, string>; value: [number, string] }[] };
}

const nf = new Intl.NumberFormat('en-US');
const nfCompact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = bytes;
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

export function formatAge(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.floor(h / 24)} days ago`;
}

export async function getRackSnapshot(): Promise<RackSnapshot | null> {
  const json = await fetchJson<PromVector>(DATA_URL);
  const result = json?.status === 'success' ? json.data?.result : undefined;
  if (!Array.isArray(result) || result.length === 0) return null;

  let maxTs = 0;
  const rows = result.map((r) => {
    const ts = Number(r.value[0]);
    if (ts > maxTs) maxTs = ts;
    return { labels: r.metric, v: Number(r.value[1]) };
  });

  const pick = (name: string, match: Record<string, string> = {}): number | null => {
    const hit = rows.find(
      (r) => r.labels.__name__ === name && Object.entries(match).every(([k, v]) => r.labels[k] === v),
    );
    return hit && Number.isFinite(hit.v) ? hit.v : null;
  };
  const all = (name: string) => rows.filter((r) => r.labels.__name__ === name);

  const upState = (up: number | null): { state: State; stateText: string } | null => {
    if (up === null) return { state: 'unknown', stateText: 'no data' };
    if (up === 0) return { state: 'down', stateText: 'down' };
    return null;
  };

  const mirror = (id: string, name: string, okMaxSeconds: number): RackService => {
    const up = pick('public:mirror_up', { mirror: id });
    const age = pick('public:mirror_sync_age_seconds', { mirror: id });
    const size = pick('public:mirror_size_bytes', { mirror: id });
    const served = pick('public:mirror_served_bytes_24h', { mirror: id });
    const s =
      upState(up) ??
      (age === null
        ? { state: 'warn' as const, stateText: 'up, sync unknown' }
        : age <= okMaxSeconds
          ? { state: 'ok' as const, stateText: 'up to date' }
          : { state: 'warn' as const, stateText: 'out of date' });
    return {
      id,
      name,
      ...s,
      facts: [
        age !== null ? `synced ${formatAge(age)}` : null,
        size !== null ? `${formatBytes(size)} on disk` : null,
        served !== null ? `${formatBytes(served)} served / 24h` : null,
      ].filter((f): f is string => f !== null),
    };
  };

  const torUp = pick('public:service_up', { service: 'tor' });
  const torFlags = all('public:tor_relay_flag')
    .filter((r) => r.v === 1)
    .map((r) => r.labels.flag)
    .filter((f) => f !== 'Running' && f !== 'Valid')
    .sort();
  const torRead = pick('public:tor_traffic_bytes_24h', { direction: 'read' });
  const torWritten = pick('public:tor_traffic_bytes_24h', { direction: 'written' });

  const ntpUp = pick('public:service_up', { service: 'ntp' });
  const ntpOffset = pick('public:ntp_rms_offset_seconds');
  const ntpStratum = pick('public:ntp_stratum');
  const ntpQps = pick('public:ntp_queries_per_second');
  const ntpQ24 = pick('public:ntp_queries_24h');

  const atlasUp = pick('public:service_up', { service: 'ripe-atlas' });
  const ooniUp = pick('public:service_up', { service: 'ooni' });
  const ooniAge = pick('public:ooni_last_run_age_seconds');

  const running = { state: 'ok' as const, stateText: 'running' };

  const services: RackService[] = [
    mirror('archlinux', 'Arch Linux mirror', 3 * 3600),
    mirror('debian', 'Debian mirror', 8 * 3600),
    {
      id: 'tor',
      name: 'Tor relay',
      ...(upState(torUp) ?? running),
      facts: [
        torRead !== null && torWritten !== null ? `${formatBytes(torRead + torWritten)} relayed / 24h` : null,
        torFlags.length ? `flags: ${torFlags.join(', ')}` : null,
      ].filter((f): f is string => f !== null),
    },
    {
      id: 'ntp',
      name: 'NTP server (NTP Pool)',
      ...(upState(ntpUp) ??
        (ntpOffset !== null && ntpOffset > 0.01 ? { state: 'warn' as const, stateText: 'clock drifting' } : running)),
      facts: [
        ntpStratum !== null ? `stratum ${ntpStratum}` : null,
        ntpQps !== null ? `${nf.format(Math.round(ntpQps))} queries/s` : null,
        ntpQ24 !== null ? `${nfCompact.format(ntpQ24)} queries / 24h` : null,
      ].filter((f): f is string => f !== null),
    },
    {
      id: 'atlas',
      name: 'RIPE Atlas probe',
      ...(upState(atlasUp) ?? running),
      facts: [],
    },
    {
      id: 'ooni',
      name: 'OONI Probe',
      ...(upState(ooniUp) ??
        (ooniAge !== null && ooniAge > 3 * 3600 ? { state: 'warn' as const, stateText: 'late' } : running)),
      facts: ooniAge !== null ? [`last run ${formatAge(ooniAge)}`] : [],
    },
  ];

  return {
    takenAt: new Date(maxTs * 1000),
    services,
    mirrorsTotal: {
      requests: pick('public:mirrors_requests_24h'),
      bytes: pick('public:mirrors_served_bytes_24h'),
      countries: pick('public:mirrors_countries_24h'),
    },
  };
}
