import { describe, it, expect, beforeEach, vi } from "vitest";
import { VocabularyService, normalizeText, classifyEntryType } from "../services/vocabulary-service";
import type { ZeroDBClient, ZeroDBRowResponse } from "../clients/zerodb-client";

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

describe("normalizeText", () => {
  it("lowercases text", () => {
    expect(normalizeText("Aprender")).toBe("aprender");
  });

  it("trims whitespace", () => {
    expect(normalizeText("  hello  ")).toBe("hello");
  });

  it("collapses internal whitespace", () => {
    expect(normalizeText("to   learn")).toBe("to learn");
  });

  it("handles mixed case and whitespace", () => {
    expect(normalizeText("  To  Learn  ")).toBe("to learn");
  });
});

describe("classifyEntryType", () => {
  it("classifies single word", () => {
    expect(classifyEntryType("aprender")).toBe("word");
  });

  it("classifies short phrase", () => {
    expect(classifyEntryType("to learn quickly")).toBe("phrase");
  });

  it("classifies sentence", () => {
    expect(classifyEntryType("I want to learn Spanish every day")).toBe("sentence");
  });
});

describe("VocabularyService", () => {
  let db: ReturnType<typeof createMockDB>;
  let service: VocabularyService;

  beforeEach(() => {
    db = createMockDB();
    service = new VocabularyService(db);
  });

  describe("createEntry", () => {
    it("creates a new vocabulary entry with correct fields", async () => {
      const entry = await service.createEntry({
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        source_text: "Aprender",
        translated_text: "To learn",
        source_language: "es",
        target_language: "en",
      });

      expect(entry.source_text).toBe("Aprender");
      expect(entry.normalized_text).toBe("aprender");
      expect(entry.translated_text).toBe("To learn");
      expect(entry.source_language).toBe("es");
      expect(entry.target_language).toBe("en");
      expect(entry.entry_type).toBe("word");
      expect(entry.status).toBe("active");
      expect(entry.is_favorite).toBe(false);
      expect(entry.is_archived).toBe(false);
      expect(entry.lookup_count).toBe(1);
      expect(entry.difficulty_score).toBe(0);
      expect(entry.confidence_score).toBe(0);
      expect(entry.tags).toEqual([]);
      expect(entry.id).toBeDefined();
      expect(entry.user_id).toBe("550e8400-e29b-41d4-a716-446655440000");

      expect(db.createRow).toHaveBeenCalledWith(
        "vocabulary_entries",
        expect.objectContaining({ normalized_text: "aprender" })
      );
    });

    it("trims source and translated text", async () => {
      const entry = await service.createEntry({
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        source_text: "  aprender  ",
        translated_text: "  to learn  ",
        source_language: "es",
        target_language: "en",
      });

      expect(entry.source_text).toBe("aprender");
      expect(entry.translated_text).toBe("to learn");
    });

    it("assigns tags when provided", async () => {
      const entry = await service.createEntry({
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        source_text: "aprender",
        translated_text: "to learn",
        source_language: "es",
        target_language: "en",
        tags: ["verb", "spanish"],
      });

      expect(entry.tags).toEqual(["verb", "spanish"]);
    });

    it("classifies phrases correctly", async () => {
      const entry = await service.createEntry({
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        source_text: "por favor",
        translated_text: "please",
        source_language: "es",
        target_language: "en",
      });

      expect(entry.entry_type).toBe("phrase");
    });
  });

  describe("getEntry", () => {
    it("returns null when entry not found", async () => {
      (db.getRow as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const result = await service.getEntry("nonexistent-id");
      expect(result).toBeNull();
    });

    it("returns entry when found", async () => {
      const entryData = {
        id: "test-id",
        user_id: "user-1",
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
        lookup_count: 1,
        first_seen_at: "2026-06-01T00:00:00.000Z",
        last_seen_at: "2026-06-01T00:00:00.000Z",
        tags: [],
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
      };

      (db.getRow as ReturnType<typeof vi.fn>).mockResolvedValue(makeRow(entryData));

      const result = await service.getEntry("test-id");
      expect(result).not.toBeNull();
      expect(result!.source_text).toBe("aprender");
      expect(result!.translated_text).toBe("to learn");
    });
  });

  describe("updateEntry", () => {
    it("returns null when entry not found", async () => {
      (db.getRow as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const result = await service.updateEntry("nonexistent", { is_favorite: true });
      expect(result).toBeNull();
    });

    it("updates specified fields", async () => {
      const existing = {
        id: "test-id",
        user_id: "user-1",
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
        lookup_count: 1,
        first_seen_at: "2026-06-01T00:00:00.000Z",
        last_seen_at: "2026-06-01T00:00:00.000Z",
        tags: [],
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
      };

      (db.getRow as ReturnType<typeof vi.fn>).mockResolvedValue(makeRow(existing));

      const result = await service.updateEntry("test-id", {
        is_favorite: true,
        confidence_score: 0.8,
      });

      expect(result).not.toBeNull();
      expect(result!.is_favorite).toBe(true);
      expect(result!.confidence_score).toBe(0.8);
      expect(result!.source_text).toBe("aprender");
      expect(db.updateRow).toHaveBeenCalledWith(
        "vocabulary_entries",
        "test-id",
        expect.objectContaining({ is_favorite: true, confidence_score: 0.8 })
      );
    });
  });

  describe("listEntries", () => {
    it("queries with user_id filter", async () => {
      (db.queryRows as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await service.listEntries("user-1", {
        page: 1,
        limit: 20,
        sort_by: "last_seen_at",
        sort_order: "desc",
      });

      expect(db.queryRows).toHaveBeenCalledWith(
        "vocabulary_entries",
        expect.objectContaining({
          filters: expect.arrayContaining([
            { field: "user_id", operator: "eq", value: "user-1" },
          ]),
          limit: 20,
          offset: 0,
        })
      );
    });

    it("applies language filters", async () => {
      (db.queryRows as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await service.listEntries("user-1", {
        page: 1,
        limit: 20,
        source_language: "es",
        target_language: "en",
        sort_by: "last_seen_at",
        sort_order: "desc",
      });

      expect(db.queryRows).toHaveBeenCalledWith(
        "vocabulary_entries",
        expect.objectContaining({
          filters: expect.arrayContaining([
            { field: "source_language", operator: "eq", value: "es" },
            { field: "target_language", operator: "eq", value: "en" },
          ]),
        })
      );
    });

    it("calculates offset from page number", async () => {
      (db.queryRows as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await service.listEntries("user-1", {
        page: 3,
        limit: 10,
        sort_by: "last_seen_at",
        sort_order: "desc",
      });

      expect(db.queryRows).toHaveBeenCalledWith(
        "vocabulary_entries",
        expect.objectContaining({
          offset: 20,
          limit: 10,
        })
      );
    });
  });

  describe("searchEntries", () => {
    it("searches by normalized text with like filter", async () => {
      (db.queryRows as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await service.searchEntries({
        q: "Aprender",
        user_id: "user-1",
        limit: 20,
      });

      expect(db.queryRows).toHaveBeenCalledWith(
        "vocabulary_entries",
        expect.objectContaining({
          filters: expect.arrayContaining([
            { field: "normalized_text", operator: "like", value: "%aprender%" },
            { field: "user_id", operator: "eq", value: "user-1" },
          ]),
        })
      );
    });
  });

  describe("findDuplicate", () => {
    it("returns null when no duplicate found", async () => {
      (db.queryRows as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await service.findDuplicate("user-1", "aprender", "es", "en");
      expect(result).toBeNull();
    });

    it("returns existing entry when duplicate found", async () => {
      const existing = {
        id: "existing-id",
        user_id: "user-1",
        normalized_text: "aprender",
        source_text: "aprender",
        translated_text: "to learn",
        source_language: "es",
        target_language: "en",
        status: "active",
        entry_type: "word",
        is_favorite: false,
        is_archived: false,
        difficulty_score: 0,
        confidence_score: 0,
        lookup_count: 3,
        first_seen_at: "2026-06-01T00:00:00.000Z",
        last_seen_at: "2026-06-01T00:00:00.000Z",
        tags: [],
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
      };

      (db.queryRows as ReturnType<typeof vi.fn>).mockResolvedValue([makeRow(existing)]);

      const result = await service.findDuplicate("user-1", "Aprender", "es", "en");
      expect(result).not.toBeNull();
      expect(result!.id).toBe("existing-id");
      expect(result!.lookup_count).toBe(3);
    });

    it("normalizes text before querying", async () => {
      (db.queryRows as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await service.findDuplicate("user-1", "  APRENDER  ", "es", "en");

      expect(db.queryRows).toHaveBeenCalledWith(
        "vocabulary_entries",
        expect.objectContaining({
          filters: expect.arrayContaining([
            { field: "normalized_text", operator: "eq", value: "aprender" },
          ]),
        })
      );
    });
  });

  describe("incrementLookup", () => {
    it("increments lookup_count and updates last_seen_at", async () => {
      const existing = {
        id: "test-id",
        user_id: "user-1",
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
        lookup_count: 3,
        first_seen_at: "2026-06-01T00:00:00.000Z",
        last_seen_at: "2026-06-01T00:00:00.000Z",
        tags: [],
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
      };

      (db.getRow as ReturnType<typeof vi.fn>).mockResolvedValue(makeRow(existing));

      const result = await service.incrementLookup("test-id");

      expect(result).not.toBeNull();
      expect(result!.lookup_count).toBe(4);
      expect(result!.last_seen_at).not.toBe(existing.last_seen_at);
      expect(db.updateRow).toHaveBeenCalledWith(
        "vocabulary_entries",
        "test-id",
        expect.objectContaining({ lookup_count: 4 })
      );
    });

    it("returns null when entry not found", async () => {
      (db.getRow as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const result = await service.incrementLookup("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("softDelete", () => {
    it("sets status to deleted and is_archived to true", async () => {
      const existing = {
        id: "test-id",
        user_id: "user-1",
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
        lookup_count: 1,
        first_seen_at: "2026-06-01T00:00:00.000Z",
        last_seen_at: "2026-06-01T00:00:00.000Z",
        tags: [],
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
      };

      (db.getRow as ReturnType<typeof vi.fn>).mockResolvedValue(makeRow(existing));

      const result = await service.softDelete("test-id");

      expect(result).not.toBeNull();
      expect(result!.status).toBe("deleted");
      expect(result!.is_archived).toBe(true);
    });
  });
});
