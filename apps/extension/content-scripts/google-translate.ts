// Google Translate DOM observer
// Watches for translation results and sends them to the service worker.

import type { CapturePayload } from "../lib/types.js";

// ─── Selectors (2024+ Google Translate DOM) ───────────────────────────────────

const SOURCE_TEXTAREA = "textarea.er8xn";
const SOURCE_TEXTAREA_ALT = "[aria-label='Source text']";
const TRANSLATION_OUTPUT = "span.HwtZe";
const TRANSLATION_OUTPUT_ALT = "[data-language-to-translate-into]";

// ─── State ────────────────────────────────────────────────────────────────────

let lastCaptured: string | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// ─── DOM helpers ──────────────────────────────────────────────────────────────

function getSourceText(): string {
  const el =
    document.querySelector<HTMLTextAreaElement>(SOURCE_TEXTAREA) ??
    document.querySelector<HTMLTextAreaElement>(SOURCE_TEXTAREA_ALT);
  return el?.value?.trim() ?? "";
}

function getTranslatedText(): string {
  const el =
    document.querySelector<HTMLElement>(TRANSLATION_OUTPUT) ??
    document.querySelector<HTMLElement>(TRANSLATION_OUTPUT_ALT);
  return el?.innerText?.trim() ?? "";
}

function getSourceLanguage(): string {
  const el = document.querySelector<HTMLElement>("[data-language-code]:not([data-language-to-translate-into])");
  return el?.dataset?.languageCode ?? "";
}

function getTargetLanguage(): string {
  const el = document.querySelector<HTMLElement>("[data-language-to-translate-into]");
  return el?.dataset?.languageToTranslateInto ?? "";
}

// ─── Capture logic ─────────────────────────────────────────────────────────────

function maybeCapture(): void {
  const sourceText = getSourceText();
  const translatedText = getTranslatedText();

  if (!sourceText || !translatedText) return;

  const captureKey = `${sourceText}::${translatedText}`;
  if (captureKey === lastCaptured) return;
  lastCaptured = captureKey;

  const payload: CapturePayload = {
    source_text: sourceText,
    translated_text: translatedText,
    source_language: getSourceLanguage(),
    target_language: getTargetLanguage(),
    capture_method: "google_translate_dom",
    source_url: location.href,
    page_title: document.title,
    timestamp: new Date().toISOString(),
  };

  chrome.runtime.sendMessage({ type: "CAPTURE_GOOGLE_TRANSLATE", payload }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("[ZeroVocab] Capture error:", chrome.runtime.lastError.message);
      return;
    }
    if (response?.success) {
      showToast("Saved to ZeroVocab");
    }
  });
}

function debouncedCapture(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(maybeCapture, 800);
}

// ─── MutationObserver ─────────────────────────────────────────────────────────

function startObserver(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "characterData" ||
        (mutation.type === "childList" && mutation.addedNodes.length > 0)
      ) {
        const target = mutation.target as Element;
        const inOutput =
          target.closest?.(".ccvoYb") !== null ||
          target.closest?.("[data-language-to-translate-into]") !== null ||
          target.closest?.(".HwtZe") !== null;

        if (inOutput) {
          debouncedCapture();
          break;
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

// ─── Toast notification ───────────────────────────────────────────────────────

let toastEl: HTMLDivElement | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(message: string): void {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.id = "zerovocab-toast";
    toastEl.style.cssText = [
      "position:fixed",
      "bottom:24px",
      "right:24px",
      "z-index:2147483647",
      "background:#18181b",
      "color:#f4f4f5",
      "padding:10px 16px",
      "border-radius:8px",
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "font-size:14px",
      "font-weight:500",
      "line-height:1.4",
      "box-shadow:0 4px 12px rgba(0,0,0,0.3)",
      "display:flex",
      "align-items:center",
      "gap:8px",
      "transition:opacity 0.2s ease",
      "opacity:0",
      "pointer-events:none",
    ].join(";");
    document.body.appendChild(toastEl);
  }

  toastEl.textContent = "";
  const icon = document.createElement("span");
  icon.textContent = "\u2713";
  icon.style.cssText = "color:#22c55e;font-weight:bold;";
  toastEl.appendChild(icon);
  toastEl.appendChild(document.createTextNode(" " + message));
  toastEl.style.opacity = "1";

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (toastEl) toastEl.style.opacity = "0";
  }, 2500);
}

// ─── Message listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SHOW_TOAST") {
    showToast(message.message);
    sendResponse({});
    return;
  }

  if (message.type === "GET_SELECTION_CONTEXT") {
    const selectedText = window.getSelection()?.toString().trim() ?? "";
    const surroundingSentence = getSurroundingSentence(selectedText);
    sendResponse({ selectedText, surroundingSentence });
    return;
  }
});

function getSurroundingSentence(selectedText: string): string {
  if (!selectedText) return "";
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return "";
  const range = sel.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const textContent =
    container.nodeType === Node.TEXT_NODE
      ? (container.parentElement?.textContent ?? "")
      : (container as Element).textContent ?? "";

  const sentences = textContent.match(/[^.!?\n]+[.!?\n]*/g) ?? [];
  return sentences.find((s) => s.includes(selectedText))?.trim() ?? "";
}

// ─── Init ─────────────────────────────────────────────────────────────────────

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startObserver);
} else {
  startObserver();
}
