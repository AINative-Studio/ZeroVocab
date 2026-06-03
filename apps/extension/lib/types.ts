export interface CapturePayload {
  source_text: string;
  translated_text?: string;
  source_language?: string;
  target_language?: string;
  capture_method: "google_translate_dom" | "text_selection" | "keyboard_shortcut";
  source_url: string;
  page_title: string;
  surrounding_sentence?: string;
  timestamp: string;
}

export interface VocabularyCaptureRequest {
  source_text: string;
  translated_text?: string;
  source_language?: string;
  target_language?: string;
  capture_method: string;
  source: {
    source_type: "browser_extension";
    source_app: string;
    source_url: string;
    page_title: string;
  };
  context?: {
    surrounding_text?: string;
  };
}

export interface VocabularyCaptureResponse {
  id: string;
  source_text: string;
  translated_text?: string;
  source_language?: string;
  target_language?: string;
  status: "active" | "archived";
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
}

export interface RecentCapture {
  id: string;
  source_text: string;
  translated_text?: string;
  source_language?: string;
  target_language?: string;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
}

export interface ExtensionConfig {
  apiUrl: string;
  apiKey: string;
  userId?: string;
  enabled: boolean;
}

export type ExtensionMessage =
  | { type: "CAPTURE_GOOGLE_TRANSLATE"; payload: CapturePayload }
  | { type: "CAPTURE_SELECTION"; payload: CapturePayload }
  | { type: "CAPTURE_KEYBOARD_SHORTCUT" }
  | { type: "GET_CONFIG" }
  | { type: "GET_RECENT_CAPTURES" }
  | { type: "FAVORITE_ENTRY"; id: string }
  | { type: "ARCHIVE_ENTRY"; id: string }
  | { type: "SHOW_TOAST"; message: string; variant: "success" | "error" };

export interface ExtensionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
