// Selection capture content script
// Handles text selection via context menu and keyboard shortcut.

let toastEl: HTMLDivElement | null = null;
let toastHideTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(message: string, variant: "success" | "error" = "success"): void {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.id = "zerovocab-selection-toast";
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
  icon.textContent = variant === "success" ? "\u2713" : "\u2717";
  icon.style.cssText = `color:${variant === "success" ? "#22c55e" : "#ef4444"};font-weight:bold;`;
  toastEl.appendChild(icon);
  toastEl.appendChild(document.createTextNode(" " + message));
  toastEl.style.opacity = "1";

  if (toastHideTimer) clearTimeout(toastHideTimer);
  toastHideTimer = setTimeout(() => {
    if (toastEl) toastEl.style.opacity = "0";
  }, 2500);
}

function getSelectedText(): string {
  return window.getSelection()?.toString().trim() ?? "";
}

function getSurroundingSentence(selectedText: string): string {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !selectedText) return "";

  const range = sel.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const fullText =
    container.nodeType === Node.TEXT_NODE
      ? (container.parentElement?.textContent ?? "")
      : (container as Element).textContent ?? "";

  const sentences = fullText.match(/[^.!?\n]+[.!?\n]*/g) ?? [];
  return sentences.find((s) => s.includes(selectedText))?.trim() ?? "";
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SHOW_TOAST") {
    showToast(message.message, message.variant ?? "success");
    sendResponse({});
    return;
  }

  if (message.type === "GET_SELECTION_CONTEXT") {
    const selectedText = getSelectedText();
    const surroundingSentence = getSurroundingSentence(selectedText);
    sendResponse({ selectedText, surroundingSentence });
    return;
  }
});
