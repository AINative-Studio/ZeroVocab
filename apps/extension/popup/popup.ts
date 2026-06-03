import {
  getConfig,
  setConfig,
  getCachedCaptures,
} from "../lib/storage.js";
import {
  getRecentCaptures,
  favoriteEntry,
  unfavoriteEntry,
  archiveEntry,
  getVocabCount,
  checkHealth,
} from "../lib/api-client.js";
import type { RecentCapture, ExtensionConfig } from "../lib/types.js";

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const statusDot = document.getElementById("status-dot") as HTMLSpanElement;
const vocabCount = document.getElementById("vocab-count") as HTMLSpanElement;
const refreshBtn = document.getElementById("refresh-btn") as HTMLButtonElement;
const settingsBtn = document.getElementById("settings-btn") as HTMLButtonElement;

const loadingState = document.getElementById("loading-state") as HTMLDivElement;
const emptyState = document.getElementById("empty-state") as HTMLDivElement;
const errorState = document.getElementById("error-state") as HTMLDivElement;
const unconfiguredState = document.getElementById("unconfigured-state") as HTMLDivElement;
const capturesList = document.getElementById("captures-list") as HTMLUListElement;
const errorMessage = document.getElementById("error-message") as HTMLParagraphElement;

const settingsPanel = document.getElementById("settings-panel") as HTMLDivElement;
const closeSettingsBtn = document.getElementById("close-settings-btn") as HTMLButtonElement;
const openSettingsBtn = document.getElementById("open-settings-btn") as HTMLButtonElement | null;
const setupBtn = document.getElementById("setup-btn") as HTMLButtonElement | null;

const settingsForm = document.getElementById("settings-form") as HTMLFormElement;
const apiUrlInput = document.getElementById("api-url") as HTMLInputElement;
const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
const userIdInput = document.getElementById("user-id") as HTMLInputElement;
const enabledToggle = document.getElementById("enabled-toggle") as HTMLInputElement;
const testConnectionBtn = document.getElementById("test-connection-btn") as HTMLButtonElement;
const settingsFeedback = document.getElementById("settings-feedback") as HTMLParagraphElement;

// ─── State ────────────────────────────────────────────────────────────────────

let currentCaptures: RecentCapture[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getLanguageLabel(code: string | undefined): string {
  if (!code) return "";
  const map: Record<string, string> = {
    en:"EN",es:"ES",fr:"FR",de:"DE",it:"IT",pt:"PT",
    zh:"ZH",ja:"JA",ko:"KO",ru:"RU",ar:"AR",nl:"NL",
    pl:"PL",sv:"SV",tr:"TR",uk:"UK",hi:"HI",vi:"VI",
  };
  return map[code.toLowerCase()] ?? code.toUpperCase().slice(0, 3);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── Status dot ───────────────────────────────────────────────────────────────

function setStatus(state: "ok" | "error" | "checking"): void {
  statusDot.className = `status-dot status-${state}`;
  statusDot.title = { ok:"Connected", error:"Disconnected", checking:"Checking\u2026" }[state];
}

// ─── State panels ─────────────────────────────────────────────────────────────

function showState(state: "loading" | "empty" | "error" | "unconfigured" | "list"): void {
  loadingState.hidden = state !== "loading";
  emptyState.hidden = state !== "empty";
  errorState.hidden = state !== "error";
  unconfiguredState.hidden = state !== "unconfigured";
  capturesList.hidden = state !== "list";
}

// ─── Renders ──────────────────────────────────────────────────────────────────

function renderCaptures(captures: RecentCapture[]): void {
  capturesList.innerHTML = "";
  if (captures.length === 0) { showState("empty"); return; }
  showState("list");
  for (const capture of captures) capturesList.appendChild(buildCaptureItem(capture));
}

function buildCaptureItem(capture: RecentCapture): HTMLLIElement {
  const li = document.createElement("li");
  li.className = `capture-item${capture.is_archived ? " is-archived" : ""}`;
  li.dataset.id = capture.id;

  const srcLang = getLanguageLabel(capture.source_language);
  const tgtLang = getLanguageLabel(capture.target_language);
  const langLabel = srcLang && tgtLang ? `${srcLang} \u2192 ${tgtLang}` : (srcLang || tgtLang);

  li.innerHTML = `
    <div class="capture-body">
      <div class="capture-source">${escapeHtml(capture.source_text)}</div>
      ${capture.translated_text ? `<div class="capture-translation">${escapeHtml(capture.translated_text)}</div>` : ""}
      <div class="capture-meta">
        ${langLabel ? `<span class="lang-badge">${escapeHtml(langLabel)}</span>` : ""}
        <span class="capture-time">${formatRelativeTime(capture.created_at)}</span>
      </div>
    </div>
    <div class="capture-actions">
      <button class="action-btn favorite-btn${capture.is_favorite ? " is-favorite" : ""}"
        title="${capture.is_favorite ? "Unfavorite" : "Favorite"}"
        aria-label="${capture.is_favorite ? "Remove from favorites" : "Add to favorites"}"
        aria-pressed="${capture.is_favorite}">
        ${starSVG(capture.is_favorite)}
      </button>
      <button class="action-btn archive-btn" title="Archive" aria-label="Archive entry">
        ${archiveSVG()}
      </button>
    </div>`;

  li.querySelector<HTMLButtonElement>(".favorite-btn")!
    .addEventListener("click", (e) => handleFavorite(capture.id, e.currentTarget as HTMLButtonElement));
  li.querySelector<HTMLButtonElement>(".archive-btn")!
    .addEventListener("click", () => handleArchive(capture.id, li));

  return li;
}

function starSVG(filled: boolean): string {
  return filled
    ? `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
}

function archiveSVG(): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`;
}

// ─── Action handlers ──────────────────────────────────────────────────────────

async function handleFavorite(id: string, btn: HTMLButtonElement): Promise<void> {
  const isFav = btn.classList.contains("is-favorite");
  btn.disabled = true;
  try {
    const updated = isFav ? await unfavoriteEntry(id) : await favoriteEntry(id);
    const newFav = updated.is_favorite;
    btn.classList.toggle("is-favorite", newFav);
    btn.setAttribute("aria-pressed", String(newFav));
    btn.title = newFav ? "Unfavorite" : "Favorite";
    btn.innerHTML = starSVG(newFav);
    currentCaptures = currentCaptures.map((c) =>
      c.id === id ? { ...c, is_favorite: newFav } : c
    );
  } catch (err) {
    console.error("[ZeroVocab] Favorite toggle failed:", err);
  } finally {
    btn.disabled = false;
  }
}

async function handleArchive(id: string, li: HTMLLIElement): Promise<void> {
  const btn = li.querySelector<HTMLButtonElement>(".archive-btn")!;
  btn.disabled = true;
  try {
    await archiveEntry(id);
    li.style.transition = "opacity 0.3s,max-height 0.3s";
    li.style.overflow = "hidden";
    li.style.maxHeight = li.offsetHeight + "px";
    li.style.opacity = "0";
    requestAnimationFrame(() => { li.style.maxHeight = "0"; });
    setTimeout(() => li.remove(), 350);
    currentCaptures = currentCaptures.filter((c) => c.id !== id);
    if (currentCaptures.length === 0) showState("empty");
  } catch (err) {
    console.error("[ZeroVocab] Archive failed:", err);
    btn.disabled = false;
  }
}

// ─── Load captures ────────────────────────────────────────────────────────────

async function loadCaptures(forceRefresh = false): Promise<void> {
  const config = await getConfig();
  if (!config.apiKey) { showState("unconfigured"); setStatus("error"); return; }

  showState("loading");

  if (!forceRefresh) {
    const cached = await getCachedCaptures();
    if (cached) {
      currentCaptures = cached;
      renderCaptures(cached);
      refreshCountSilently();
      return;
    }
  }

  try {
    const captures = await getRecentCaptures(10);
    currentCaptures = captures;
    renderCaptures(captures);
    try {
      const { total } = await getVocabCount();
      vocabCount.textContent = String(total);
    } catch {
      vocabCount.textContent = String(captures.length);
    }
    setStatus("ok");
  } catch (err) {
    errorMessage.textContent = err instanceof Error ? err.message : "Unknown error";
    showState("error");
    setStatus("error");
  }
}

async function refreshCountSilently(): Promise<void> {
  try {
    const { total } = await getVocabCount();
    vocabCount.textContent = String(total);
  } catch { /* ignore */ }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

async function openSettings(): Promise<void> {
  const config = await getConfig();
  apiUrlInput.value = config.apiUrl;
  apiKeyInput.value = config.apiKey;
  userIdInput.value = config.userId ?? "";
  enabledToggle.checked = config.enabled;
  settingsFeedback.textContent = "";
  settingsFeedback.className = "settings-feedback";
  settingsPanel.hidden = false;
}

function closeSettings(): void { settingsPanel.hidden = true; }

async function saveSettings(e: SubmitEvent): Promise<void> {
  e.preventDefault();
  const config: Partial<ExtensionConfig> = {
    apiUrl: apiUrlInput.value.trim(),
    apiKey: apiKeyInput.value.trim(),
    userId: userIdInput.value.trim() || undefined,
    enabled: enabledToggle.checked,
  };
  try {
    await setConfig(config);
    showFeedback("Settings saved", "success");
    setTimeout(() => { closeSettings(); loadCaptures(true); }, 800);
  } catch {
    showFeedback("Failed to save settings", "error");
  }
}

async function testConnection(): Promise<void> {
  testConnectionBtn.disabled = true;
  showFeedback("Testing\u2026", "");
  await setConfig({ apiUrl: apiUrlInput.value.trim(), apiKey: apiKeyInput.value.trim() });
  const healthy = await checkHealth();
  if (healthy) {
    showFeedback("Connection successful!", "success");
    setStatus("ok");
  } else {
    showFeedback("Could not connect \u2014 check URL and API key", "error");
    setStatus("error");
  }
  testConnectionBtn.disabled = false;
}

function showFeedback(msg: string, type: "success" | "error" | ""): void {
  settingsFeedback.textContent = msg;
  settingsFeedback.className = `settings-feedback${type ? ` ${type}` : ""}`;
}

// ─── Event wiring ─────────────────────────────────────────────────────────────

refreshBtn.addEventListener("click", async () => {
  refreshBtn.classList.add("spinning");
  await loadCaptures(true);
  refreshBtn.classList.remove("spinning");
});
settingsBtn.addEventListener("click", openSettings);
closeSettingsBtn.addEventListener("click", closeSettings);
openSettingsBtn?.addEventListener("click", openSettings);
setupBtn?.addEventListener("click", openSettings);
settingsForm.addEventListener("submit", saveSettings);
testConnectionBtn.addEventListener("click", testConnection);

// ─── Init ─────────────────────────────────────────────────────────────────────

(async () => {
  setStatus("checking");
  const healthy = await checkHealth();
  setStatus(healthy ? "ok" : "error");
  await loadCaptures();
})();
