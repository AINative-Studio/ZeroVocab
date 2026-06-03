import { z } from "zod";

export const ContextTypeEnum = z.enum(["sentence", "page", "paragraph"]);
export type ContextType = z.infer<typeof ContextTypeEnum>;

export const CreateContextSchema = z.object({
  vocabulary_entry_id: z.string().uuid(),
  context_type: ContextTypeEnum,
  original_sentence: z.string().optional(),
  translated_sentence: z.string().optional(),
  surrounding_text: z.string().optional(),
  url: z.string().url().optional(),
  page_title: z.string().optional(),
  source_application: z.string().optional(),
});

export type CreateContextInput = z.infer<typeof CreateContextSchema>;

export const ListContextsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListContextsQuery = z.infer<typeof ListContextsQuerySchema>;

export interface ContextResponse {
  id: string;
  vocabulary_entry_id: string;
  context_type: string;
  original_sentence?: string;
  translated_sentence?: string;
  surrounding_text?: string;
  url?: string;
  page_title?: string;
  source_application?: string;
  content_hash: string;
  created_at: string;
}

export interface ContextListResponse {
  contexts: ContextResponse[];
  total: number;
  limit: number;
  offset: number;
}
