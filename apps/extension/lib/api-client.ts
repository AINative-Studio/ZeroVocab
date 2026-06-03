import type {
  VocabularyCaptureRequest,
  VocabularyCaptureResponse,
  RecentCapture,
} from "./types.js";
import { getConfig } from "./storage.js";

async function fetchWithAuth<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const config = await getConfig();

  if (!config.apiUrl || !config.apiKey) {
    throw new Error("ZeroVocab is not configured. Please set your API URL and key.");
  }

  const url = `${config.apiUrl.replace(/\/$/, "")}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": config.apiKey,
      ...(config.userId ? { "X-User-Id": config.userId } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      errorMessage = body.detail ?? body.message ?? errorMessage;
    } catch {
      // ignore parse errors
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export async function captureVocabulary(
  payload: VocabularyCaptureRequest
): Promise<VocabularyCaptureResponse> {
  return fetchWithAuth<VocabularyCaptureResponse>("/api/v1/vocabulary/capture", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRecentCaptures(limit = 10): Promise<RecentCapture[]> {
  const config = await getConfig();
  const params = new URLSearchParams({ limit: String(limit) });
  if (config.userId) {
    params.set("user_id", config.userId);
  }
  return fetchWithAuth<RecentCapture[]>(`/api/v1/vocabulary/captures?${params}`);
}

export async function favoriteEntry(id: string): Promise<VocabularyCaptureResponse> {
  return fetchWithAuth<VocabularyCaptureResponse>(
    `/api/v1/vocabulary/captures/${id}/favorite`,
    { method: "POST" }
  );
}

export async function unfavoriteEntry(id: string): Promise<VocabularyCaptureResponse> {
  return fetchWithAuth<VocabularyCaptureResponse>(
    `/api/v1/vocabulary/captures/${id}/favorite`,
    { method: "DELETE" }
  );
}

export async function archiveEntry(id: string): Promise<VocabularyCaptureResponse> {
  return fetchWithAuth<VocabularyCaptureResponse>(
    `/api/v1/vocabulary/captures/${id}/archive`,
    { method: "POST" }
  );
}

export async function getVocabCount(): Promise<{ total: number }> {
  return fetchWithAuth<{ total: number }>("/api/v1/vocabulary/captures/count");
}

export async function checkHealth(): Promise<boolean> {
  try {
    const config = await getConfig();
    if (!config.apiUrl || !config.apiKey) return false;
    const url = `${config.apiUrl.replace(/\/$/, "")}/health`;
    const resp = await fetch(url, {
      headers: { "X-Api-Key": config.apiKey },
    });
    return resp.ok;
  } catch {
    return false;
  }
}
