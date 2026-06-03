export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  source_language: string;
  target_language: string;
  preferences: LearningPreferences;
  memory_namespace: string;
  created_at: string;
  updated_at: string;
}

export interface LearningPreferences {
  review_frequency: "daily" | "every_other_day" | "weekly" | "custom";
  reminder_schedule: string;
  daily_word_target: number;
  difficulty_preference: "easy" | "medium" | "hard" | "mixed";
}

export interface CreateUserInput {
  email: string;
  display_name: string;
  source_language?: string;
  target_language?: string;
}

export interface UpdateUserInput {
  display_name?: string;
  source_language?: string;
  target_language?: string;
}

export interface UpdateLanguagesInput {
  source_language: string;
  target_language: string;
}

export interface UpdatePreferencesInput {
  review_frequency?: "daily" | "every_other_day" | "weekly" | "custom";
  reminder_schedule?: string;
  daily_word_target?: number;
  difficulty_preference?: "easy" | "medium" | "hard" | "mixed";
}

export interface ZeroDBRow<T = Record<string, unknown>> {
  id: string;
  row_data: T;
  created_at: string;
  updated_at: string;
}

export interface ZeroDBQueryFilter {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "in";
  value: unknown;
}
