import { z } from "zod";

export const translationEventSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  vocabulary_entry_id: z.string().uuid(),
  source_text: z.string(),
  translated_text: z.string(),
  source_language: z.string(),
  target_language: z.string(),
  provider: z.string(),
  capture_method: z.string(),
  url: z.string().url().optional(),
  page_title: z.string().optional(),
  captured_at: z.string().datetime(),
});

export type TranslationEvent = z.infer<typeof translationEventSchema>;
