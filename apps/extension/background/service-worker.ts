import {
  captureVocabulary,
  favoriteEntry,
  unfavoriteEntry,
  archiveEntry,
  getRecentCaptures,
  checkHealth,
} from "../lib/api-client.js";
import {
  prependCaptureToCache,
  updateCaptureInCache,
  setCachedCaptures,
  invalidateCapturescache,
} from "../lib/storage.js";
import type { ExtensionMessage, CapturePayload } from "../lib/types.js";

// ─── Context menu setup ───────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "zerovocab-save",
    title: "Save to ZeroVocab",
    contexts: ["selection"],
  });
});

// ─── Context menu click handler ───────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "zerovocab-save") return;
  if (!info.selectionText || !tab?.id) return;

  chrome.tabs.sendMessage(
    tab.id,
    { type: "GET_SELECTION_CONTEXT" },
    async (response) => {
      const payload: CapturePayload = {
        source_text: info.selectionText!.trim(),
        capture_method: "text_selection",
        source_url: tab.url ?? "",
        page_title: tab.title ?? "",
        surrounding_sentence: response?.surroundingSentence ?? undefined,
        timestamp: new Date().toISOString(),
      };
      await handleCapture(payload);
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: "SHOW_TOAST",
          message: "Saved to ZeroVocab",
          variant: "success",
        });
      }
    }
  );
});

// ─── Keyboard shortcut handler ────────────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "capture-selection") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.tabs.sendMessage(
    tab.id,
    { type: "GET_SELECTION_CONTEXT" },
    async (response) => {
      if (!response?.selectedText) return;

      const payload: CapturePayload = {
        source_text: response.selectedText.trim(),
        capture_method: "keyboard_shortcut",
        source_url: tab.url ?? "",
        page_title: tab.title ?? "",
        surrounding_sentence: response.surroundingSentence ?? undefined,
        timestamp: new Date().toISOString(),
      };
      await handleCapture(payload);
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: "SHOW_TOAST",
          message: "Saved to ZeroVocab",
          variant: "success",
        });
      }
    }
  );
});

// ─── Message handler ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    handleMessage(message, sendResponse);
    return true; // keep the channel open for async responses
  }
);

async function handleMessage(
  message: ExtensionMessage,
  sendResponse: (response: unknown) => void
): Promise<void> {
  switch (message.type) {
    case "CAPTURE_GOOGLE_TRANSLATE":
    case "CAPTURE_SELECTION": {
      const result = await handleCapture(message.payload);
      sendResponse(result);
      break;
    }

    case "GET_CONFIG": {
      sendResponse({ success: true });
      break;
    }

    case "GET_RECENT_CAPTURES": {
      try {
        const captures = await getRecentCaptures(10);
        await setCachedCaptures(captures);
        sendResponse({ success: true, data: captures });
      } catch (err) {
        sendResponse({ success: false, error: String(err) });
      }
      break;
    }

    case "FAVORITE_ENTRY": {
      try {
        const entry = await favoriteEntry(message.id);
        await updateCaptureInCache(message.id, { is_favorite: entry.is_favorite });
        sendResponse({ success: true, data: entry });
      } catch (err) {
        sendResponse({ success: false, error: String(err) });
      }
      break;
    }

    case "ARCHIVE_ENTRY": {
      try {
        await archiveEntry(message.id);
        await invalidateCapturescache();
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: String(err) });
      }
      break;
    }

    default:
      sendResponse({ success: false, error: "Unknown message type" });
  }
}

// ─── Capture helper ───────────────────────────────────────────────────────────

async function handleCapture(
  payload: CapturePayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const sourceApp =
      payload.capture_method === "google_translate_dom"
        ? "google_translate"
        : "browser";

    const result = await captureVocabulary({
      source_text: payload.source_text,
      translated_text: payload.translated_text,
      source_language: payload.source_language,
      target_language: payload.target_language,
      capture_method: payload.capture_method,
      source: {
        source_type: "browser_extension",
        source_app: sourceApp,
        source_url: payload.source_url,
        page_title: payload.page_title,
      },
      ...(payload.surrounding_sentence
        ? { context: { surrounding_text: payload.surrounding_sentence } }
        : {}),
    });

    await prependCaptureToCache({
      id: result.id,
      source_text: result.source_text,
      translated_text: result.translated_text,
      source_language: result.source_language,
      target_language: result.target_language,
      is_favorite: result.is_favorite,
      is_archived: result.is_archived,
      created_at: result.created_at,
    });

    return { success: true };
  } catch (err) {
    console.error("[ZeroVocab] Capture failed:", err);
    return { success: false, error: String(err) };
  }
}

// ─── Health ping on startup ───────────────────────────────────────────────────

checkHealth().then((healthy) => {
  console.log(`[ZeroVocab] API health: ${healthy ? "ok" : "unreachable"}`);
});
