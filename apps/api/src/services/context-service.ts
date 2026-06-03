import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { ZeroDBClient } from "../clients/zerodb-client";
import {
  CreateContextInput,
  ContextResponse,
  ContextListResponse,
} from "../schemas/context";

const TABLE_NAME = "vocabulary_contexts";

function generateContentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function rowToContext(row: {
  id: string;
  row_data: Record<string, unknown>;
  created_at: string;
}): ContextResponse {
  const d = row.row_data;
  return {
    id: row.id,
    vocabulary_entry_id: d.vocabulary_entry_id as string,
    context_type: d.context_type as string,
    original_sentence: d.original_sentence as string | undefined,
    translated_sentence: d.translated_sentence as string | undefined,
    surrounding_text: d.surrounding_text as string | undefined,
    url: d.url as string | undefined,
    page_title: d.page_title as string | undefined,
    source_application: d.source_application as string | undefined,
    content_hash: d.content_hash as string,
    created_at: row.created_at,
  };
}

export class ContextService {
  constructor(private db: ZeroDBClient) {}

  /**
   * Story 4.1 — Save sentence context with deduplication via content_hash.
   */
  async saveSentenceContext(
    vocabularyEntryId: string,
    data: {
      original_sentence: string;
      translated_sentence?: string;
      surrounding_text?: string;
    }
  ): Promise<ContextResponse> {
    const contentHash = generateContentHash(data.original_sentence);

    const existing = await this.findByContentHash(
      vocabularyEntryId,
      contentHash
    );
    if (existing) {
      return existing;
    }

    const rowData: Record<string, unknown> = {
      id: uuidv4(),
      vocabulary_entry_id: vocabularyEntryId,
      context_type: "sentence",
      original_sentence: data.original_sentence,
      translated_sentence: data.translated_sentence,
      surrounding_text: data.surrounding_text,
      content_hash: contentHash,
      created_at: new Date().toISOString(),
    };

    const row = await this.db.createRow(TABLE_NAME, rowData);
    return rowToContext(row);
  }

  /**
   * Story 4.2 — Save page context (title, URL, source application).
   */
  async savePageContext(
    vocabularyEntryId: string,
    data: {
      page_title?: string;
      url?: string;
      source_application?: string;
    }
  ): Promise<ContextResponse> {
    const hashSource = [data.url, data.page_title].filter(Boolean).join("|");
    const contentHash = generateContentHash(hashSource || uuidv4());

    if (hashSource) {
      const existing = await this.findByContentHash(
        vocabularyEntryId,
        contentHash
      );
      if (existing) {
        return existing;
      }
    }

    const rowData: Record<string, unknown> = {
      id: uuidv4(),
      vocabulary_entry_id: vocabularyEntryId,
      context_type: "page",
      page_title: data.page_title,
      url: data.url,
      source_application: data.source_application,
      content_hash: contentHash,
      created_at: new Date().toISOString(),
    };

    const row = await this.db.createRow(TABLE_NAME, rowData);
    return rowToContext(row);
  }

  /**
   * Story 4.3 — List contexts for a vocabulary entry with pagination.
   */
  async listContexts(
    vocabularyEntryId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<ContextListResponse> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    const rows = await this.db.queryRows(TABLE_NAME, {
      filters: [
        {
          field: "vocabulary_entry_id",
          operator: "eq",
          value: vocabularyEntryId,
        },
      ],
      sort_by: "created_at",
      sort_order: "desc",
      limit,
      offset,
    });

    const contexts = rows.map(rowToContext);

    return {
      contexts,
      total: contexts.length,
      limit,
      offset,
    };
  }

  /**
   * Get a single context by ID.
   */
  async getContext(id: string): Promise<ContextResponse | null> {
    const row = await this.db.getRow(TABLE_NAME, id);
    if (!row) return null;
    return rowToContext(row);
  }

  /**
   * Delete a context by ID.
   */
  async deleteContext(id: string): Promise<void> {
    await this.db.deleteRow(TABLE_NAME, id);
  }

  /**
   * Helper for the capture flow — creates both sentence and page context
   * from a single capture payload.
   */
  async createContextFromCapture(
    vocabularyEntryId: string,
    capturePayload: {
      original_sentence?: string;
      translated_sentence?: string;
      surrounding_text?: string;
      url?: string;
      page_title?: string;
      source_application?: string;
    }
  ): Promise<ContextResponse[]> {
    const results: ContextResponse[] = [];

    if (capturePayload.original_sentence) {
      const sentenceCtx = await this.saveSentenceContext(vocabularyEntryId, {
        original_sentence: capturePayload.original_sentence,
        translated_sentence: capturePayload.translated_sentence,
        surrounding_text: capturePayload.surrounding_text,
      });
      results.push(sentenceCtx);
    }

    if (capturePayload.url || capturePayload.page_title) {
      const pageCtx = await this.savePageContext(vocabularyEntryId, {
        url: capturePayload.url,
        page_title: capturePayload.page_title,
        source_application: capturePayload.source_application,
      });
      results.push(pageCtx);
    }

    return results;
  }

  /**
   * Find an existing context by content_hash for dedup.
   */
  private async findByContentHash(
    vocabularyEntryId: string,
    contentHash: string
  ): Promise<ContextResponse | null> {
    const rows = await this.db.queryRows(TABLE_NAME, {
      filters: [
        {
          field: "vocabulary_entry_id",
          operator: "eq",
          value: vocabularyEntryId,
        },
        { field: "content_hash", operator: "eq", value: contentHash },
      ],
      limit: 1,
    });

    if (rows.length === 0) return null;
    return rowToContext(rows[0]);
  }
}
