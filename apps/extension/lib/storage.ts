import type { ExtensionConfig, RecentCapture } from "./types.js";

const CONFIG_KEY = "zerovocab_config";
const CACHE_KEY = "zerovocab_recent_captures";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  captures: RecentCapture[];
  cached_at: number;
}

export const DEFAULT_CONFIG: ExtensionConfig = {
  apiUrl: "https://zerovocab.ainative.studio",
  apiKey: "",
  userId: undefined,
  enabled: true,
};

export async function getConfig(): Promise<ExtensionConfig> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(CONFIG_KEY, (result) => {
      const stored = result[CONFIG_KEY] as Partial<ExtensionConfig> | undefined;
      resolve({ ...DEFAULT_CONFIG, ...stored });
    });
  });
}

export async function setConfig(config: Partial<ExtensionConfig>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(CONFIG_KEY, (result) => {
      const current = (result[CONFIG_KEY] as Partial<ExtensionConfig>) ?? {};
      const merged = { ...DEFAULT_CONFIG, ...current, ...config };
      chrome.storage.sync.set({ [CONFIG_KEY]: merged }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  });
}

export async function getCachedCaptures(): Promise<RecentCapture[] | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(CACHE_KEY, (result) => {
      const entry = result[CACHE_KEY] as CacheEntry | undefined;
      if (!entry) {
        resolve(null);
        return;
      }
      const age = Date.now() - entry.cached_at;
      if (age > CACHE_TTL_MS) {
        resolve(null);
        return;
      }
      resolve(entry.captures);
    });
  });
}

export async function setCachedCaptures(captures: RecentCapture[]): Promise<void> {
  return new Promise((resolve) => {
    const entry: CacheEntry = { captures, cached_at: Date.now() };
    chrome.storage.local.set({ [CACHE_KEY]: entry }, resolve);
  });
}

export async function invalidateCapturescache(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(CACHE_KEY, resolve);
  });
}

export async function prependCaptureToCache(capture: RecentCapture): Promise<void> {
  const cached = await getCachedCaptures();
  const list = cached ?? [];
  const updated = [capture, ...list.filter((c) => c.id !== capture.id)].slice(0, 50);
  await setCachedCaptures(updated);
}

export async function updateCaptureInCache(
  id: string,
  updates: Partial<RecentCapture>
): Promise<void> {
  const cached = await getCachedCaptures();
  if (!cached) return;
  const updated = cached.map((c) => (c.id === id ? { ...c, ...updates } : c));
  await setCachedCaptures(updated);
}
