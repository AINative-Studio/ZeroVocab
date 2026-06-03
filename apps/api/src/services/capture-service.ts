import { v4 as uuidv4 } from "uuid";
import type { ZeroDBClient } from "../clients/zerodb-client";
import type {
  CapturePayload,
  VocabularyEntry,
} from "../schemas/vocabulary";
import type { TranslationEvent } from "../schemas/translation-event";
import { VocabularyService } from "./vocabulary-service";

const EVENTS_TABLE = "translation_events";

export interface CaptureResult {
  entry: VocabularyEntry;
  event: TranslationEvent;
  is_duplicate: boolean;
}

export class CaptureService {
  private vocabService: VocabularyService;

  constructor(private db: ZeroDBClient) {
    this.vocabService = new VocabularyService(db);
  }

  /**
   * Main capture handler (Story 2.1 - #20).
   *
   * 1. Check for duplicates (Story 2.4 - #23)
   * 2. Create translation_events row
   * 3. Upsert vocabulary_entries row
   * 4. Return created/updated entry
   */
  async captureVocabulary(payload: CapturePayload): Promise<CaptureResult> {
    // Step 1: Duplicate detection
    const existing = await this.vocabService.findDuplicate(
      payload.user_id,
      payload.source_text,
      payload.source_language,
      payload.target_language
    );

    let entry: VocabularyEntry;
    let isDuplicate = false;

    if (existing) {
      // Duplicate found: increment lookup count, update last_seen
      isDuplicate = true;
      const updated = await this.vocabService.incrementLookup(existing.id);
      entry = updated!;
    } else {
      // New entry: create fresh vocabulary entry
      entry = await this.vocabService.createEntry({
        user_id: payload.user_id,
        source_text: payload.source_text,
        translated_text: payload.translated_text,
        source_language: payload.source_language,
        target_language: payload.target_language,
      });
    }

    // Step 2: Always create a translation event (captures every lookup)
    const event = await this.createTranslationEvent(payload, entry.id);

    return { entry, event, is_duplicate: isDuplicate };
  }

  private async createTranslationEvent(
    payload: CapturePayload,
    vocabularyEntryId: string
  ): Promise<TranslationEvent> {
    const now = new Date().toISOString();

    const event: TranslationEvent = {
      id: uuidv4(),
      user_id: payload.user_id,
      vocabulary_entry_id: vocabularyEntryId,
      source_text: payload.source_text.trim(),
      translated_text: payload.translated_text.trim(),
      source_language: payload.source_language,
      target_language: payload.target_language,
      provider: payload.source.source_app,
      capture_method: payload.source.capture_method,
      url: payload.context?.url,
      page_title: payload.context?.page_title,
      captured_at: now,
    };

    await this.db.createRow(
      EVENTS_TABLE,
      event as unknown as Record<string, unknown>
    );

    return event;
  }
}
