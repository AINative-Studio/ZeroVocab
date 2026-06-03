import { describe, it, expect, beforeEach, vi } from "vitest";
import { CaptureService } from "../services/capture-service";
import type { ZeroDBClient, ZeroDBRowResponse } from "../clients/zerodb-client";
import type { CapturePayload } from "../schemas/vocabulary";

function createMockDB(): ZeroDBClient {
  return {
    createRow: vi.fn().mockResolvedValue({}),
    getRow: vi.fn().mockResolvedValue(null),
    updateRow: vi.fn().mockResolvedValue({}),
    queryRows: vi.fn().mockResolvedValue([]),
    deleteRow: vi.fn().mockResolvedValue(undefined),
  } as unknown as ZeroDBClient;
}

function makeRow(data: Record<string, unknown>): ZeroDBRowResponse {
  return {
    id: data.id as string,
    row_data: data,
    created_at: data.created_at as string ?? new Date().toISOString(),
    updated_at: data.updated_at as string ?? new Date().toISOString(),
  };
}

function makePayload(overrides: Partial<CapturePayload> = {}): CapturePayload {
  return {
    user_id: "550e8400-e29b-41d4-a716-446655440000",
    source_text: "aprender",
    translated_text: "to learn",
    source_language: "es",
    target_language: "en",
    context: {
      original_sentence: "Quiero aprender espanol.",
      translated_sentence: "I want to learn Spanish.",
      url: "https://translate.google.com",
      page_title: "Google Translate",
    },
    source: {
      source_type: "browser_extension",
      source_app: "google_translate",
      capture_method: "dom_observer",
    },
    ...overrides,
  };
}

describe("CaptureService", () => {
  let db: ReturnType<typeof createMockDB>;
  let service: CaptureService;

  beforeEach(() => {
    db = createMockDB();
    service = new CaptureService(db);
  });

  describe("captureVocabulary", () => {
    it("creates new entry and event when no duplicate exists", async () => {
      // queryRows returns empty (no duplicate)
      (db.queryRows as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await service.captureVocabulary(makePayload());

      expect(result.is_duplicate).toBe(false);
      expect(result.entry.source_text).toBe("aprender");
      expect(result.entry.translated_text).toBe("to learn");
      expect(result.entry.lookup_count).toBe(1);
      expect(result.event.provider).toBe("google_translate");
      expect(result.event.capture_method).toBe("dom_observer");
      expect(result.event.url).toBe("https://translate.google.com");

      // Should have called createRow twice: once for vocabulary_entries, once for translation_events
      expect(db.createRow).toHaveBeenCalledTimes(2);
      expect(db.createRow).toHaveBeenCalledWith(
        "vocabulary_entries",
        expect.objectContaining({ normalized_text: "aprender" })
      );
      expect(db.createRow).toHaveBeenCalledWith(
        "translation_events",
        expect.objectContaining({
          provider: "google_translate",
          capture_method: "dom_observer",
        })
      );
    });

    it("updates existing entry when duplicate found", async () => {
      const existingEntry = {
        id: "existing-vocab-id",
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        entry_type: "word",
        source_text: "aprender",
        normalized_text: "aprender",
        translated_text: "to learn",
        source_language: "es",
        target_language: "en",
        status: "active",
        is_favorite: false,
        is_archived: false,
        difficulty_score: 0,
        confidence_score: 0,
        lookup_count: 2,
        first_seen_at: "2026-06-01T00:00:00.000Z",
        last_seen_at: "2026-06-01T00:00:00.000Z",
        tags: [],
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
      };

      // findDuplicate queries => returns existing
      (db.queryRows as ReturnType<typeof vi.fn>).mockResolvedValue([
        makeRow(existingEntry),
      ]);
      // incrementLookup getRow => returns existing
      (db.getRow as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeRow(existingEntry)
      );

      const result = await service.captureVocabulary(makePayload());

      expect(result.is_duplicate).toBe(true);
      expect(result.entry.lookup_count).toBe(3);
      expect(result.entry.id).toBe("existing-vocab-id");

      // Should have called updateRow for vocabulary_entries (incrementLookup)
      expect(db.updateRow).toHaveBeenCalledWith(
        "vocabulary_entries",
        "existing-vocab-id",
        expect.objectContaining({ lookup_count: 3 })
      );

      // Should still create a translation event
      expect(db.createRow).toHaveBeenCalledWith(
        "translation_events",
        expect.objectContaining({
          vocabulary_entry_id: "existing-vocab-id",
        })
      );
    });

    it("always creates a translation event even for duplicates", async () => {
      const existing = {
        id: "existing-id",
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        entry_type: "word",
        source_text: "aprender",
        normalized_text: "aprender",
        translated_text: "to learn",
        source_language: "es",
        target_language: "en",
        status: "active",
        is_favorite: false,
        is_archived: false,
        difficulty_score: 0,
        confidence_score: 0,
        lookup_count: 5,
        first_seen_at: "2026-06-01T00:00:00.000Z",
        last_seen_at: "2026-06-01T00:00:00.000Z",
        tags: [],
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
      };

      (db.queryRows as ReturnType<typeof vi.fn>).mockResolvedValue([makeRow(existing)]);
      (db.getRow as ReturnType<typeof vi.fn>).mockResolvedValue(makeRow(existing));

      await service.captureVocabulary(makePayload());

      // createRow called once for translation_events (not vocabulary_entries since duplicate)
      expect(db.createRow).toHaveBeenCalledTimes(1);
      expect(db.createRow).toHaveBeenCalledWith(
        "translation_events",
        expect.any(Object)
      );
    });

    it("handles keyboard_shortcut capture method", async () => {
      (db.queryRows as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await service.captureVocabulary(
        makePayload({
          source: {
            source_type: "browser_extension",
            source_app: "manual",
            capture_method: "keyboard_shortcut",
          },
        })
      );

      expect(result.event.capture_method).toBe("keyboard_shortcut");
      expect(result.event.provider).toBe("manual");
    });

    it("handles right_click capture method", async () => {
      (db.queryRows as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await service.captureVocabulary(
        makePayload({
          source: {
            source_type: "browser_extension",
            source_app: "deepl",
            capture_method: "right_click",
          },
        })
      );

      expect(result.event.capture_method).toBe("right_click");
    });

    it("handles API source type", async () => {
      (db.queryRows as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await service.captureVocabulary(
        makePayload({
          source: {
            source_type: "api",
            source_app: "chatgpt",
            capture_method: "selection",
          },
        })
      );

      expect(result.entry).toBeDefined();
      expect(result.event.provider).toBe("chatgpt");
    });

    it("handles MCP source type", async () => {
      (db.queryRows as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await service.captureVocabulary(
        makePayload({
          source: {
            source_type: "mcp",
            source_app: "claude",
            capture_method: "selection",
          },
        })
      );

      expect(result.entry).toBeDefined();
      expect(result.event.provider).toBe("claude");
    });

    it("preserves context fields in translation event", async () => {
      (db.queryRows as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await service.captureVocabulary(
        makePayload({
          context: {
            original_sentence: "Quiero aprender.",
            translated_sentence: "I want to learn.",
            url: "https://deepl.com",
            page_title: "DeepL Translate",
          },
        })
      );

      expect(result.event.url).toBe("https://deepl.com");
      expect(result.event.page_title).toBe("DeepL Translate");
    });

    it("handles missing context gracefully", async () => {
      (db.queryRows as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const payload = makePayload();
      delete payload.context;

      const result = await service.captureVocabulary(payload);

      expect(result.event.url).toBeUndefined();
      expect(result.event.page_title).toBeUndefined();
    });

    it("sets vocabulary_entry_id on the translation event", async () => {
      (db.queryRows as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await service.captureVocabulary(makePayload());

      expect(result.event.vocabulary_entry_id).toBe(result.entry.id);
    });
  });
});
