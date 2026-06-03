import { v4 as uuidv4 } from "uuid";
import { ZeroDBClient } from "../clients/zerodb-client";
import {
  CreateUserSchema,
  UpdateUserSchema,
  UpdateLanguagesSchema,
  UpdatePreferencesSchema,
  LearningPreferencesSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type UpdateLanguagesInput,
  type UpdatePreferencesInput,
  type LearningPreferences,
} from "../schemas/user";

const TABLE_NAME = "users";

export interface UserRecord {
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

export class UserService {
  constructor(private db: ZeroDBClient) {}

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    const validated = CreateUserSchema.parse(input);
    const defaultPreferences = LearningPreferencesSchema.parse({});

    const userId = uuidv4();
    const now = new Date().toISOString();

    const userData: UserRecord = {
      id: userId,
      email: validated.email,
      display_name: validated.display_name,
      source_language: validated.source_language ?? "en",
      target_language: validated.target_language ?? "es",
      preferences: defaultPreferences,
      memory_namespace: `zerovocab:${userId}`,
      created_at: now,
      updated_at: now,
    };

    await this.db.createRow(TABLE_NAME, userData as unknown as Record<string, unknown>);
    return userData;
  }

  async getUser(id: string): Promise<UserRecord | null> {
    const row = await this.db.getRow(TABLE_NAME, id);
    if (!row) return null;
    return row.row_data as unknown as UserRecord;
  }

  async updateUser(
    id: string,
    input: UpdateUserInput
  ): Promise<UserRecord | null> {
    const validated = UpdateUserSchema.parse(input);
    const existing = await this.getUser(id);
    if (!existing) return null;

    const updates: Partial<UserRecord> = {
      ...validated,
      updated_at: new Date().toISOString(),
    };

    const merged = { ...existing, ...updates };
    await this.db.updateRow(TABLE_NAME, id, merged as unknown as Record<string, unknown>);
    return merged as UserRecord;
  }

  async updateLanguages(
    id: string,
    input: UpdateLanguagesInput
  ): Promise<UserRecord | null> {
    const validated = UpdateLanguagesSchema.parse(input);
    const existing = await this.getUser(id);
    if (!existing) return null;

    const updated: UserRecord = {
      ...existing,
      source_language: validated.source_language,
      target_language: validated.target_language,
      updated_at: new Date().toISOString(),
    };

    await this.db.updateRow(TABLE_NAME, id, updated as unknown as Record<string, unknown>);
    return updated;
  }

  async updatePreferences(
    id: string,
    input: UpdatePreferencesInput
  ): Promise<UserRecord | null> {
    const validated = UpdatePreferencesSchema.parse(input);
    const existing = await this.getUser(id);
    if (!existing) return null;

    const updatedPreferences: LearningPreferences = {
      ...existing.preferences,
      ...validated,
    };

    const updated: UserRecord = {
      ...existing,
      preferences: updatedPreferences,
      updated_at: new Date().toISOString(),
    };

    await this.db.updateRow(TABLE_NAME, id, updated as unknown as Record<string, unknown>);
    return updated;
  }
}
