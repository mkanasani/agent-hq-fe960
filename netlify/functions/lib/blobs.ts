import { getStore } from "@netlify/blobs";

export type Store = ReturnType<typeof getStore>;

export function store(name: string): Store {
  // Try auto-config first (works when BLOBS_CONTEXT env var is present).
  // Fall back to explicit siteID + token from the runtime env — needed on
  // sites where Netlify isn't injecting BLOBS_CONTEXT for functions.
  const siteID = process.env.SITE_ID;
  const token =
    process.env.NETLIFY_FUNCTIONS_TOKEN ?? process.env.NETLIFY_BLOBS_TOKEN;
  if (!process.env.BLOBS_CONTEXT && siteID && token) {
    return getStore({ name, siteID, token, consistency: "strong" });
  }
  return getStore({ name, consistency: "strong" });
}

export async function readJson<T>(s: Store, key: string): Promise<T | null> {
  const raw = await s.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw as string) as T;
  } catch {
    return null;
  }
}

export async function writeJson<T>(s: Store, key: string, value: T): Promise<void> {
  await s.set(key, JSON.stringify(value));
}

export async function listJson<T>(s: Store, prefix?: string): Promise<T[]> {
  const { blobs } = await s.list(prefix ? { prefix } : undefined);
  const out: T[] = [];
  for (const b of blobs) {
    const v = await readJson<T>(s, b.key);
    if (v) out.push(v);
  }
  return out;
}
