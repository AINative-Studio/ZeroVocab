import { z } from "zod";

// ISO 639-1 language codes (common subset)
const languageCodeSchema = z
  .string()
  .min(2)
  .max(5)
  .regex(/^[a-z]{2}(-[A-Z]{2})?$/, "Must be a valid ISO 639-1 language code");

// --- Source metadata ---

export const captureSourceSchema = z.object({
  source_type: z.enum(["browser_extension", "api", "mcp"]),
  source_app: z.enum([
    "google_translate",
    "deepl",
    "manual",
    "chatgpt",
    "claude",
  ]),
  capture_method: z.enum([
    "dom_observer",
    "selection",
    "keyboard_shortcut",
    "right_click",
  ]),
});

export const captureContextSchema = z.object({
  original_sentence: z.string().optional(),
  translated_sentence: z.string().optional(),
  url: z.string().url().optional(),
  page_title: z.string().optional(),
});

// --- Capture payload (inbound from extension/API) ---

export const capturePayloadSchema = z.object({
  user_id: z.string().uuid(),
  source_text: z.string().min(1).max(5000),
  translated_text: z.string().min(1).max(5000),
  source_language: languageCodeSchema,
  target_language: languageCodeSchema,
  context: captureContextSchema.optional(),
  source: captureSourceSchema,
});

export type CapturePayload = z.infer<typeof capturePayloadSchema>;
export type CaptureSource = z.infer<typeof captureSourceSchema>;
export type CaptureContext = z.infer<typeof captureContextSchema>;

// --- Vocabulary entry (stored record) ---

export const entryStatusSchema = z.enum(["active", "archived", "deleted"]);
export const entryTypeSchema = z.enum(["word", "phrase", "idiom", "sentence"]);

export const vocabularyEntrySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  entry_type: entryTypeSchema,
  source_text: z.string(),
  normalized_text: z.string(),
  translated_text: z.string(),
  source_language: languageCodeSchema,
  target_language: languageCodeSchema,
  status: entryStatusSchema,
  is_favorite: z.boolean(),
  is_archived: z.boolean(),
  difficulty_score: z.number().min(0).max(1),
  confidence_score: z.number().min(0).max(1),
  lookup_count: z.number().int().min(0),
  first_seen_at: z.string().datetime(),
  last_seen_at: z.string().datetime(),
  tags: z.array(z.string()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type VocabularyEntry = z.infer<typeof vocabularyEntrySchema>;

// --- Update payload ---

export const updateEntrySchema = z.object({
  translated_text: z.string().min(1).max(5000).optional(),
  status: entryStatusSchema.optional(),
  is_favorite: z.boolean().optional(),
  is_archived: z.boolean().optional(),
  difficulty_score: z.number().min(0).max(1).optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  tags: z.array(z.string()).optional(),
});

export type UpdateEntryPayload = z.infer<typeof updateEntrySchema>;

// --- List / search query params ---

export const listEntriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: entryStatusSchema.optional(),
  source_language: languageCodeSchema.optional(),
  target_language: languageCodeSchema.optional(),
  is_favorite: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  sort_by: z
    .enum(["created_at", "last_seen_at", "lookup_count", "confidence_score"])
    .default("last_seen_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

export type ListEntriesQuery = z.infer<typeof listEntriesQuerySchema>;

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(500),
  user_id: z.string().uuid(),
  source_language: languageCodeSchema.optional(),
  target_language: languageCodeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
