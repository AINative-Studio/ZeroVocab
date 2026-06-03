import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "../services/user-service";
import { ZeroDBClient } from "../clients/zerodb-client";

// Mock ZeroDB client
function createMockDB(): ZeroDBClient {
  return {
    createRow: vi.fn(),
    getRow: vi.fn(),
    updateRow: vi.fn(),
    queryRows: vi.fn(),
    deleteRow: vi.fn(),
  } as unknown as ZeroDBClient;
}

describe("UserService", () => {
  let service: UserService;
  let mockDB: ZeroDBClient;

  beforeEach(() => {
    mockDB = createMockDB();
    service = new UserService(mockDB);
  });

  describe("createUser", () => {
    it("should create a user with valid input", async () => {
      (mockDB.createRow as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "mock-row-id",
        row_data: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const result = await service.createUser({
        email: "test@example.com",
        display_name: "Test User",
      });

      expect(result.email).toBe("test@example.com");
      expect(result.display_name).toBe("Test User");
      expect(result.source_language).toBe("en");
      expect(result.target_language).toBe("es");
      expect(result.preferences.review_frequency).toBe("daily");
      expect(result.preferences.daily_word_target).toBe(10);
      expect(result.preferences.difficulty_preference).toBe("mixed");
      expect(result.preferences.reminder_schedule).toBe("09:00");
      expect(result.memory_namespace).toMatch(/^zerovocab:/);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();

      expect(mockDB.createRow).toHaveBeenCalledWith(
        "users",
        expect.objectContaining({
          email: "test@example.com",
          display_name: "Test User",
        })
      );
    });

    it("should create a user with custom languages", async () => {
      (mockDB.createRow as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "mock-row-id",
        row_data: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const result = await service.createUser({
        email: "user@example.com",
        display_name: "Custom Lang User",
        source_language: "fr",
        target_language: "de",
      });

      expect(result.source_language).toBe("fr");
      expect(result.target_language).toBe("de");
    });

    it("should reject invalid email", async () => {
      await expect(
        service.createUser({
          email: "not-an-email",
          display_name: "Bad Email",
        })
      ).rejects.toThrow();
    });

    it("should reject empty display name", async () => {
      await expect(
        service.createUser({
          email: "valid@example.com",
          display_name: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("getUser", () => {
    it("should return user when found", async () => {
      const mockUser = {
        id: "user-123",
        email: "found@example.com",
        display_name: "Found User",
        source_language: "en",
        target_language: "es",
        preferences: {
          review_frequency: "daily",
          reminder_schedule: "09:00",
          daily_word_target: 10,
          difficulty_preference: "mixed",
        },
        memory_namespace: "zerovocab:user-123",
        created_at: "2026-06-02T00:00:00Z",
        updated_at: "2026-06-02T00:00:00Z",
      };

      (mockDB.getRow as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-123",
        row_data: mockUser,
        created_at: "2026-06-02T00:00:00Z",
        updated_at: "2026-06-02T00:00:00Z",
      });

      const result = await service.getUser("user-123");

      expect(result).not.toBeNull();
      expect(result!.email).toBe("found@example.com");
      expect(result!.display_name).toBe("Found User");
    });

    it("should return null when user not found", async () => {
      (mockDB.getRow as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await service.getUser("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("updateUser", () => {
    const existingUser = {
      id: "user-123",
      email: "user@example.com",
      display_name: "Original Name",
      source_language: "en",
      target_language: "es",
      preferences: {
        review_frequency: "daily" as const,
        reminder_schedule: "09:00",
        daily_word_target: 10,
        difficulty_preference: "mixed" as const,
      },
      memory_namespace: "zerovocab:user-123",
      created_at: "2026-06-02T00:00:00Z",
      updated_at: "2026-06-02T00:00:00Z",
    };

    beforeEach(() => {
      (mockDB.getRow as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-123",
        row_data: existingUser,
        created_at: existingUser.created_at,
        updated_at: existingUser.updated_at,
      });
      (mockDB.updateRow as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-123",
        row_data: {},
        created_at: existingUser.created_at,
        updated_at: new Date().toISOString(),
      });
    });

    it("should update display name", async () => {
      const result = await service.updateUser("user-123", {
        display_name: "New Name",
      });

      expect(result).not.toBeNull();
      expect(result!.display_name).toBe("New Name");
      expect(result!.email).toBe("user@example.com");
    });

    it("should return null for nonexistent user", async () => {
      (mockDB.getRow as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await service.updateUser("nonexistent", {
        display_name: "New Name",
      });
      expect(result).toBeNull();
    });
  });

  describe("updateLanguages (Refs #18)", () => {
    const existingUser = {
      id: "user-456",
      email: "lang@example.com",
      display_name: "Lang User",
      source_language: "en",
      target_language: "es",
      preferences: {
        review_frequency: "daily" as const,
        reminder_schedule: "09:00",
        daily_word_target: 10,
        difficulty_preference: "mixed" as const,
      },
      memory_namespace: "zerovocab:user-456",
      created_at: "2026-06-02T00:00:00Z",
      updated_at: "2026-06-02T00:00:00Z",
    };

    beforeEach(() => {
      (mockDB.getRow as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-456",
        row_data: existingUser,
        created_at: existingUser.created_at,
        updated_at: existingUser.updated_at,
      });
      (mockDB.updateRow as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-456",
        row_data: {},
        created_at: existingUser.created_at,
        updated_at: new Date().toISOString(),
      });
    });

    it("should update source and target languages", async () => {
      const result = await service.updateLanguages("user-456", {
        source_language: "fr",
        target_language: "de",
      });

      expect(result).not.toBeNull();
      expect(result!.source_language).toBe("fr");
      expect(result!.target_language).toBe("de");
    });

    it("should reject missing source_language", async () => {
      await expect(
        service.updateLanguages("user-456", {
          source_language: "",
          target_language: "de",
        })
      ).rejects.toThrow();
    });

    it("should return null for nonexistent user", async () => {
      (mockDB.getRow as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await service.updateLanguages("nonexistent", {
        source_language: "fr",
        target_language: "de",
      });
      expect(result).toBeNull();
    });
  });

  describe("updatePreferences (Refs #19)", () => {
    const existingUser = {
      id: "user-789",
      email: "pref@example.com",
      display_name: "Pref User",
      source_language: "en",
      target_language: "es",
      preferences: {
        review_frequency: "daily" as const,
        reminder_schedule: "09:00",
        daily_word_target: 10,
        difficulty_preference: "mixed" as const,
      },
      memory_namespace: "zerovocab:user-789",
      created_at: "2026-06-02T00:00:00Z",
      updated_at: "2026-06-02T00:00:00Z",
    };

    beforeEach(() => {
      (mockDB.getRow as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-789",
        row_data: existingUser,
        created_at: existingUser.created_at,
        updated_at: existingUser.updated_at,
      });
      (mockDB.updateRow as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-789",
        row_data: {},
        created_at: existingUser.created_at,
        updated_at: new Date().toISOString(),
      });
    });

    it("should update review frequency", async () => {
      const result = await service.updatePreferences("user-789", {
        review_frequency: "weekly",
      });

      expect(result).not.toBeNull();
      expect(result!.preferences.review_frequency).toBe("weekly");
      expect(result!.preferences.daily_word_target).toBe(10); // unchanged
    });

    it("should update daily word target", async () => {
      const result = await service.updatePreferences("user-789", {
        daily_word_target: 20,
      });

      expect(result).not.toBeNull();
      expect(result!.preferences.daily_word_target).toBe(20);
    });

    it("should update difficulty preference", async () => {
      const result = await service.updatePreferences("user-789", {
        difficulty_preference: "hard",
      });

      expect(result).not.toBeNull();
      expect(result!.preferences.difficulty_preference).toBe("hard");
    });

    it("should update multiple preferences at once", async () => {
      const result = await service.updatePreferences("user-789", {
        review_frequency: "every_other_day",
        daily_word_target: 15,
        reminder_schedule: "18:00",
        difficulty_preference: "easy",
      });

      expect(result).not.toBeNull();
      expect(result!.preferences.review_frequency).toBe("every_other_day");
      expect(result!.preferences.daily_word_target).toBe(15);
      expect(result!.preferences.reminder_schedule).toBe("18:00");
      expect(result!.preferences.difficulty_preference).toBe("easy");
    });

    it("should reject invalid daily word target", async () => {
      await expect(
        service.updatePreferences("user-789", {
          daily_word_target: 0,
        })
      ).rejects.toThrow();
    });

    it("should reject daily word target over 100", async () => {
      await expect(
        service.updatePreferences("user-789", {
          daily_word_target: 101,
        })
      ).rejects.toThrow();
    });

    it("should return null for nonexistent user", async () => {
      (mockDB.getRow as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await service.updatePreferences("nonexistent", {
        review_frequency: "weekly",
      });
      expect(result).toBeNull();
    });
  });
});
