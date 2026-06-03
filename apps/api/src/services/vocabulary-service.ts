import { v4 as uuidv4 } from "uuid";
import type {
  ZeroDBClient,
  ZeroDBRowResponse,
  ZeroDBQueryOptions,
} from "../clients/zerodb-client";
import type {
  VocabularyEntry,
  UpdateEntryPayload,
  ListEntriesQuery,
  SearchQuery,
} from "../schemas/vocabulary";

const TABLE = "vocabulary_entries";

/**
 * Normalize text for duplicate detection:
 * lowercase, trim, collapse whitespace.
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Classify entry type based on word count.
 */
export function classifyEntryType(
  text: string
): "word" | "phrase" | "sentence" {
  const words = text.trim().split(/\s+/).length;
  if (words === 1) return "word";
  if (words <= 5) return "phrase";
  return "sentence";
}

function rowToEntry(row: ZeroDBRowResponse): VocabularyEntry {
  return row.row_data as unknown as VocabularyEntry;
}

export class VocabularyService {
  constructor(private db: ZeroDBClient) {}

  async createEntry(data: {
    user_id: string;
    source_text: string;
    translated_text: string;
    source_language: string;
    target_language: string;
    tags?: string[];
  }): Promise<VocabularyEntry> {
    const now = new Date().toISOString();
    const id = uuidv4();
    const normalized = normalizeText(data.source_text);
    const entryType = classifyEntryType(data.source_text);

    const entry: VocabularyEntry = {
      id,
      user_id: data.user_id,
      entry_type: entryType,
      source_text: data.source_text.trim(),
      normalized_text: normalized,
      translated_text: data.translated_text.trim(),
      source_language: data.source_language,
      target_language: data.target_language,
      status: "active",
      is_favorite: false,
      is_archived: false,
      difficulty_score: 0,
      confidence_score: 0,
      lookup_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      tags: data.tags ?? [],
      created_at: now,
      updated_at: now,
    };

    await this.db.createRow(TABLE, entry as unknown as Record<string, unknown>);
    return entry;
  }

  async updateEntry(
    id: string,
    data: UpdateEntryPayload
  ): Promise<VocabularyEntry | null> {
    const existing = await this.db.getRow(TABLE, id);
    if (!existing) return null;

    const current = rowToEntry(existing);
    const now = new Date().toISOString();

    const updated: VocabularyEntry = {
      ...current,
      ...data,
      is_archived:
        data.is_archived ?? (data.status === "archived" ? true : current.is_archived),
      updated_at: now,
    };

    await this.db.updateRow(
      TABLE,
      id,
      updated as unknown as Record<string, unknown>
    );
    return updated;
  }

  async getEntry(id: string): Promise<VocabularyEntry | null> {
    const row = await this.db.getRow(TABLE, id);
    if (!row) return null;
    return rowToEntry(row);
  }

  async listEntries(
    userId: string,
    query: ListEntriesQuery
  ): Promise<{ entries: VocabularyEntry[]; total: number }> {
    const options: ZeroDBQueryOptions = {
      filters: [{ field: "user_id", operator: "eq", value: userId }],
      sort_by: query.sort_by,
      sort_order: query.sort_order,
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    };

    if (query.status) {
      options.filters!.push({
        field: "status",
        operator: "eq",
        value: query.status,
      });
    } else {
      // Default: exclude deleted
      options.filters!.push({
        field: "status",
        operator: "neq",
        value: "deleted",
      });
    }

    if (query.source_language) {
      options.filters!.push({
        field: "source_language",
        operator: "eq",
        value: query.source_language,
      });
    }

    if (query.target_language) {
      options.filters!.push({
        field: "target_language",
        operator: "eq",
        value: query.target_language,
      });
    }

    if (query.is_favorite !== undefined) {
      options.filters!.push({
        field: "is_favorite",
        operator: "eq",
        value: query.is_favorite,
      });
    }

    const rows = await this.db.queryRows(TABLE, options);
    return {
      entries: rows.map(rowToEntry),
      total: rows.length,
    };
  }

  async searchEntries(
    query: SearchQuery
  ): Promise<VocabularyEntry[]> {
    const options: ZeroDBQueryOptions = {
      filters: [
        { field: "user_id", operator: "eq", value: query.user_id },
        { field: "status", operator: "neq", value: "deleted" },
        { field: "normalized_text", operator: "like", value: `%${normalizeText(query.q)}%` },
      ],
      limit: query.limit,
    };

    if (query.source_language) {
      options.filters!.push({
        field: "source_language",
        operator: "eq",
        value: query.source_language,
      });
    }

    if (query.target_language) {
      options.filters!.push({
        field: "target_language",
        operator: "eq",
        value: query.target_language,
      });
    }

    const rows = await this.db.queryRows(TABLE, options);
    return rows.map(rowToEntry);
  }

  /**
   * Find an existing entry by normalized text + language pair for a user.
   * Used for duplicate detection (Story 2.4 - #23).
   */
  async findDuplicate(
    userId: string,
    sourceText: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<VocabularyEntry | null> {
    const normalized = normalizeText(sourceText);

    const options: ZeroDBQueryOptions = {
      filters: [
        { field: "user_id", operator: "eq", value: userId },
        { field: "normalized_text", operator: "eq", value: normalized },
        { field: "source_language", operator: "eq", value: sourceLanguage },
        { field: "target_language", operator: "eq", value: targetLanguage },
        { field: "status", operator: "neq", value: "deleted" },
      ],
      limit: 1,
    };

    const rows = await this.db.queryRows(TABLE, options);
    if (rows.length === 0) return null;
    return rowToEntry(rows[0]);
  }

  /**
   * Increment lookup_count and update last_seen_at on an existing entry.
   * Called when a duplicate capture is detected.
   */
  async incrementLookup(id: string): Promise<VocabularyEntry | null> {
    const existing = await this.db.getRow(TABLE, id);
    if (!existing) return null;

    const current = rowToEntry(existing);
    const now = new Date().toISOString();

    const updated: VocabularyEntry = {
      ...current,
      lookup_count: current.lookup_count + 1,
      last_seen_at: now,
      updated_at: now,
    };

    await this.db.updateRow(
      TABLE,
      id,
      updated as unknown as Record<string, unknown>
    );
    return updated;
  }

  /**
   * Soft delete: set status to "deleted" and is_archived to true.
   */
  async softDelete(id: string): Promise<VocabularyEntry | null> {
    return this.updateEntry(id, {
      status: "deleted",
      is_archived: true,
    });
  }
}
