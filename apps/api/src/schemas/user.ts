import { z } from "zod";

export const LearningPreferencesSchema = z.object({
  review_frequency: z
    .enum(["daily", "every_other_day", "weekly", "custom"])
    .default("daily"),
  reminder_schedule: z.string().default("09:00"),
  daily_word_target: z.number().int().min(1).max(100).default(10),
  difficulty_preference: z
    .enum(["easy", "medium", "hard", "mixed"])
    .default("mixed"),
});

export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  display_name: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name too long"),
  source_language: z.string().min(2).max(10).default("en"),
  target_language: z.string().min(2).max(10).default("es"),
});

export const UpdateUserSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  source_language: z.string().min(2).max(10).optional(),
  target_language: z.string().min(2).max(10).optional(),
});

export const UpdateLanguagesSchema = z.object({
  source_language: z.string().min(2).max(10),
  target_language: z.string().min(2).max(10),
});

export const UpdatePreferencesSchema = z.object({
  review_frequency: z
    .enum(["daily", "every_other_day", "weekly", "custom"])
    .optional(),
  reminder_schedule: z.string().optional(),
  daily_word_target: z.number().int().min(1).max(100).optional(),
  difficulty_preference: z
    .enum(["easy", "medium", "hard", "mixed"])
    .optional(),
});

export type CreateUserInput = z.input<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UpdateLanguagesInput = z.infer<typeof UpdateLanguagesSchema>;
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;
export type LearningPreferences = z.infer<typeof LearningPreferencesSchema>;
