import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "crypto";
import { ContextService } from "../services/context-service";
import { ZeroDBClient } from "../clients/zerodb-client";

// Mock ZeroDBClient
function createMockDB() {
  return {
    createRow: vi.fn(),
    getRow: vi.fn(),
    updateRow: vi.fn(),
    queryRows: vi.fn(),
    deleteRow: vi.fn(),
  } as unknown as ZeroDBClient & {
    createRow: ReturnType<typeof vi.fn>;
    getRow: ReturnType<typeof vi.fn>;
    updateRow: ReturnType<typeof vi.fn>;
    queryRows: ReturnType<typeof vi.fn>;
    deleteRow: ReturnType<typeof vi.fn>;
  };
}

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

const VOCAB_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("ContextService", () => {
  let db: ReturnType<typeof createMockDB>;
  let service: ContextService;

  beforeEach(() => {
    db = createMockDB();
    service = new ContextService(db);
  });

  describe("saveSentenceContext (#28)", () => {
    it("creates a sentence context with content_hash", async () => {
      const sentence = "Quiero aprender español.";
      const expectedHash = sha256(sentence);

      // No existing duplicate
      db.queryRows.mockResolvedValueOnce([]);
      // Create row
      db.createRow.mockResolvedValueOnce({
        id: "ctx-1",
        row_data: {
          vocabulary_entry_id: VOCAB_ID,
          context_type: "sentence",
          original_sentence: sentence,
          translated_sentence: "I want to learn Spanish.",
          content_hash: expectedHash,
        },
        created_at: "2026-06-02T10:00:00Z",
        updated_at: "2026-06-02T10:00:00Z",
      });

      const result = await service.saveSentenceContext(VOCAB_ID, {
        original_sentence: sentence,
        translated_sentence: "I want to learn Spanish.",
      });

      expect(result.context_type).toBe("sentence");
      expect(result.original_sentence).toBe(sentence);
      expect(result.translated_sentence).toBe("I want to learn Spanish.");
      expect(result.content_hash).toBe(expectedHash);
      expect(result.vocabulary_entry_id).toBe(VOCAB_ID);

      // Verify dedup check was called
      expect(db.queryRows).toHaveBeenCalledWith("vocabulary_contexts", {
        filters: [
          { field: "vocabulary_entry_id", operator: "eq", value: VOCAB_ID },
          { field: "content_hash", operator: "eq", value: expectedHash },
        ],
        limit: 1,
      });

      // Verify row was created
      expect(db.createRow).toHaveBeenCalledWith(
        "vocabulary_contexts",
        expect.objectContaining({
          vocabulary_entry_id: VOCAB_ID,
          context_type: "sentence",
          original_sentence: sentence,
          content_hash: expectedHash,
        })
      );
    });

    it("returns existing context when duplicate content_hash found", async () => {
      const sentence = "Quiero aprender español.";
      const expectedHash = sha256(sentence);

      // Existing duplicate found
      db.queryRows.mockResolvedValueOnce([
        {
          id: "existing-ctx",
          row_data: {
            vocabulary_entry_id: VOCAB_ID,
            context_type: "sentence",
            original_sentence: sentence,
            translated_sentence: "I want to learn Spanish.",
            content_hash: expectedHash,
          },
          created_at: "2026-06-01T10:00:00Z",
          updated_at: "2026-06-01T10:00:00Z",
        },
      ]);

      const result = await service.saveSentenceContext(VOCAB_ID, {
        original_sentence: sentence,
        translated_sentence: "I want to learn Spanish.",
      });

      expect(result.id).toBe("existing-ctx");
      // createRow should NOT have been called
      expect(db.createRow).not.toHaveBeenCalled();
    });

    it("generates different hashes for different sentences", async () => {
      const hash1 = sha256("Hola mundo.");
      const hash2 = sha256("Buenos días.");

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("savePageContext (#29)", () => {
    it("creates a page context with url and title", async () => {
      const url = "https://example.com/lesson";
      const title = "Spanish Lesson 1";
      const hashSource = `${url}|${title}`;
      const expectedHash = sha256(hashSource);

      db.queryRows.mockResolvedValueOnce([]);
      db.createRow.mockResolvedValueOnce({
        id: "ctx-page-1",
        row_data: {
          vocabulary_entry_id: VOCAB_ID,
          context_type: "page",
          url,
          page_title: title,
          source_application: "google_translate",
          content_hash: expectedHash,
        },
        created_at: "2026-06-02T10:00:00Z",
        updated_at: "2026-06-02T10:00:00Z",
      });

      const result = await service.savePageContext(VOCAB_ID, {
        url,
        page_title: title,
        source_application: "google_translate",
      });

      expect(result.context_type).toBe("page");
      expect(result.url).toBe(url);
      expect(result.page_title).toBe(title);
      expect(result.source_application).toBe("google_translate");
      expect(result.content_hash).toBe(expectedHash);
    });

    it("deduplicates page contexts by url+title hash", async () => {
      const url = "https://example.com/lesson";
      const title = "Spanish Lesson 1";
      const hashSource = `${url}|${title}`;
      const expectedHash = sha256(hashSource);

      db.queryRows.mockResolvedValueOnce([
        {
          id: "existing-page-ctx",
          row_data: {
            vocabulary_entry_id: VOCAB_ID,
            context_type: "page",
            url,
            page_title: title,
            content_hash: expectedHash,
          },
          created_at: "2026-06-01T10:00:00Z",
          updated_at: "2026-06-01T10:00:00Z",
        },
      ]);

      const result = await service.savePageContext(VOCAB_ID, {
        url,
        page_title: title,
      });

      expect(result.id).toBe("existing-page-ctx");
      expect(db.createRow).not.toHaveBeenCalled();
    });
  });

  describe("listContexts (#30)", () => {
    it("returns paginated contexts sorted by created_at desc", async () => {
      db.queryRows.mockResolvedValueOnce([
        {
          id: "ctx-3",
          row_data: {
            vocabulary_entry_id: VOCAB_ID,
            context_type: "sentence",
            original_sentence: "Tercera oración.",
            content_hash: sha256("Tercera oración."),
          },
          created_at: "2026-06-03T10:00:00Z",
          updated_at: "2026-06-03T10:00:00Z",
        },
        {
          id: "ctx-2",
          row_data: {
            vocabulary_entry_id: VOCAB_ID,
            context_type: "page",
            url: "https://example.com",
            content_hash: sha256("https://example.com"),
          },
          created_at: "2026-06-02T10:00:00Z",
          updated_at: "2026-06-02T10:00:00Z",
        },
      ]);

      const result = await service.listContexts(VOCAB_ID, {
        limit: 10,
        offset: 0,
      });

      expect(result.contexts).toHaveLength(2);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
      expect(result.contexts[0].id).toBe("ctx-3");
      expect(result.contexts[1].id).toBe("ctx-2");

      expect(db.queryRows).toHaveBeenCalledWith("vocabulary_contexts", {
        filters: [
          { field: "vocabulary_entry_id", operator: "eq", value: VOCAB_ID },
        ],
        sort_by: "created_at",
        sort_order: "desc",
        limit: 10,
        offset: 0,
      });
    });

    it("uses default pagination values", async () => {
      db.queryRows.mockResolvedValueOnce([]);

      await service.listContexts(VOCAB_ID);

      expect(db.queryRows).toHaveBeenCalledWith("vocabulary_contexts", {
        filters: [
          { field: "vocabulary_entry_id", operator: "eq", value: VOCAB_ID },
        ],
        sort_by: "created_at",
        sort_order: "desc",
        limit: 20,
        offset: 0,
      });
    });
  });

  describe("multiple contexts per entry (#30)", () => {
    it("allows multiple contexts for the same vocabulary entry", async () => {
      // First context — sentence
      db.queryRows.mockResolvedValueOnce([]); // dedup check
      db.createRow.mockResolvedValueOnce({
        id: "ctx-sent-1",
        row_data: {
          vocabulary_entry_id: VOCAB_ID,
          context_type: "sentence",
          original_sentence: "Sentence one.",
          content_hash: sha256("Sentence one."),
        },
        created_at: "2026-06-02T10:00:00Z",
        updated_at: "2026-06-02T10:00:00Z",
      });

      // Second context — page
      db.queryRows.mockResolvedValueOnce([]); // dedup check
      db.createRow.mockResolvedValueOnce({
        id: "ctx-page-1",
        row_data: {
          vocabulary_entry_id: VOCAB_ID,
          context_type: "page",
          url: "https://example.com",
          content_hash: sha256("https://example.com"),
        },
        created_at: "2026-06-02T10:01:00Z",
        updated_at: "2026-06-02T10:01:00Z",
      });

      const sent = await service.saveSentenceContext(VOCAB_ID, {
        original_sentence: "Sentence one.",
      });
      const page = await service.savePageContext(VOCAB_ID, {
        url: "https://example.com",
      });

      expect(sent.id).toBe("ctx-sent-1");
      expect(page.id).toBe("ctx-page-1");
      expect(sent.vocabulary_entry_id).toBe(VOCAB_ID);
      expect(page.vocabulary_entry_id).toBe(VOCAB_ID);
      expect(db.createRow).toHaveBeenCalledTimes(2);
    });
  });

  describe("getContext", () => {
    it("returns context when found", async () => {
      db.getRow.mockResolvedValueOnce({
        id: "ctx-1",
        row_data: {
          vocabulary_entry_id: VOCAB_ID,
          context_type: "sentence",
          original_sentence: "Test.",
          content_hash: sha256("Test."),
        },
        created_at: "2026-06-02T10:00:00Z",
        updated_at: "2026-06-02T10:00:00Z",
      });

      const result = await service.getContext("ctx-1");
      expect(result).not.toBeNull();
      expect(result!.id).toBe("ctx-1");
    });

    it("returns null when not found", async () => {
      db.getRow.mockResolvedValueOnce(null);
      const result = await service.getContext("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("deleteContext", () => {
    it("calls db.deleteRow", async () => {
      db.deleteRow.mockResolvedValueOnce(undefined);
      await service.deleteContext("ctx-1");
      expect(db.deleteRow).toHaveBeenCalledWith("vocabulary_contexts", "ctx-1");
    });
  });

  describe("createContextFromCapture", () => {
    it("creates both sentence and page context from capture payload", async () => {
      // Sentence dedup check
      db.queryRows.mockResolvedValueOnce([]);
      db.createRow.mockResolvedValueOnce({
        id: "ctx-sent",
        row_data: {
          vocabulary_entry_id: VOCAB_ID,
          context_type: "sentence",
          original_sentence: "Quiero aprender.",
          content_hash: sha256("Quiero aprender."),
        },
        created_at: "2026-06-02T10:00:00Z",
        updated_at: "2026-06-02T10:00:00Z",
      });

      // Page dedup check
      db.queryRows.mockResolvedValueOnce([]);
      db.createRow.mockResolvedValueOnce({
        id: "ctx-page",
        row_data: {
          vocabulary_entry_id: VOCAB_ID,
          context_type: "page",
          url: "https://translate.google.com",
          page_title: "Google Translate",
          content_hash: sha256("https://translate.google.com|Google Translate"),
        },
        created_at: "2026-06-02T10:00:00Z",
        updated_at: "2026-06-02T10:00:00Z",
      });

      const results = await service.createContextFromCapture(VOCAB_ID, {
        original_sentence: "Quiero aprender.",
        translated_sentence: "I want to learn.",
        url: "https://translate.google.com",
        page_title: "Google Translate",
        source_application: "google_translate",
      });

      expect(results).toHaveLength(2);
      expect(results[0].context_type).toBe("sentence");
      expect(results[1].context_type).toBe("page");
    });

    it("creates only sentence context when no url/title provided", async () => {
      db.queryRows.mockResolvedValueOnce([]);
      db.createRow.mockResolvedValueOnce({
        id: "ctx-sent-only",
        row_data: {
          vocabulary_entry_id: VOCAB_ID,
          context_type: "sentence",
          original_sentence: "Hola.",
          content_hash: sha256("Hola."),
        },
        created_at: "2026-06-02T10:00:00Z",
        updated_at: "2026-06-02T10:00:00Z",
      });

      const results = await service.createContextFromCapture(VOCAB_ID, {
        original_sentence: "Hola.",
      });

      expect(results).toHaveLength(1);
      expect(results[0].context_type).toBe("sentence");
    });

    it("creates only page context when no sentence provided", async () => {
      db.queryRows.mockResolvedValueOnce([]);
      db.createRow.mockResolvedValueOnce({
        id: "ctx-page-only",
        row_data: {
          vocabulary_entry_id: VOCAB_ID,
          context_type: "page",
          url: "https://example.com",
          content_hash: sha256("https://example.com"),
        },
        created_at: "2026-06-02T10:00:00Z",
        updated_at: "2026-06-02T10:00:00Z",
      });

      const results = await service.createContextFromCapture(VOCAB_ID, {
        url: "https://example.com",
      });

      expect(results).toHaveLength(1);
      expect(results[0].context_type).toBe("page");
    });

    it("returns empty array when no context data provided", async () => {
      const results = await service.createContextFromCapture(VOCAB_ID, {});
      expect(results).toHaveLength(0);
      expect(db.createRow).not.toHaveBeenCalled();
    });
  });
});
