import { Router, Request, Response } from "express";
import { ZodError } from "zod";
import { ZeroDBClient } from "../clients/zerodb-client";
import { CaptureService } from "../services/capture-service";
import { VocabularyService } from "../services/vocabulary-service";
import {
  capturePayloadSchema,
  updateEntrySchema,
  listEntriesQuerySchema,
  searchQuerySchema,
} from "../schemas/vocabulary";

function getParamId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

export function createVocabularyRouter(db: ZeroDBClient): Router {
  const router = Router();
  const captureService = new CaptureService(db);
  const vocabService = new VocabularyService(db);

  /**
   * POST /api/v1/vocabulary/capture
   * Capture a vocabulary entry from any source.
   * Refs #20, #22, #23
   */
  router.post("/capture", async (req: Request, res: Response) => {
    try {
      const payload = capturePayloadSchema.parse(req.body);
      const result = await captureService.captureVocabulary(payload);

      res.status(result.is_duplicate ? 200 : 201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }
      console.error("Capture error:", (error as Error).message);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });

  /**
   * GET /api/v1/vocabulary/search
   * Search vocabulary entries by text, language, tags.
   * Refs #24
   */
  router.get("/search", async (req: Request, res: Response) => {
    try {
      const query = searchQuerySchema.parse(req.query);
      const entries = await vocabService.searchEntries(query);

      res.json({
        success: true,
        data: { entries, total: entries.length },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }
      console.error("Search error:", (error as Error).message);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });

  /**
   * GET /api/v1/vocabulary
   * List vocabulary entries with pagination and filters.
   * Refs #24
   */
  router.get("/", async (req: Request, res: Response) => {
    try {
      const userId = req.query.user_id as string;
      if (!userId) {
        res.status(400).json({
          success: false,
          error: "user_id query parameter is required",
        });
        return;
      }

      const query = listEntriesQuerySchema.parse(req.query);
      const result = await vocabService.listEntries(userId, query);

      res.json({
        success: true,
        data: {
          entries: result.entries,
          total: result.total,
          page: query.page,
          limit: query.limit,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }
      console.error("List error:", (error as Error).message);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });

  /**
   * GET /api/v1/vocabulary/:id
   * Get a single vocabulary entry with enrichments.
   * Refs #24
   */
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const entry = await vocabService.getEntry(getParamId(req));
      if (!entry) {
        res.status(404).json({
          success: false,
          error: "Vocabulary entry not found",
        });
        return;
      }

      res.json({ success: true, data: entry });
    } catch (error) {
      console.error("Get error:", (error as Error).message);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });

  /**
   * PATCH /api/v1/vocabulary/:id
   * Update a vocabulary entry.
   * Refs #25
   */
  router.patch("/:id", async (req: Request, res: Response) => {
    try {
      const data = updateEntrySchema.parse(req.body);
      const entry = await vocabService.updateEntry(getParamId(req), data);
      if (!entry) {
        res.status(404).json({
          success: false,
          error: "Vocabulary entry not found",
        });
        return;
      }

      res.json({ success: true, data: entry });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }
      console.error("Update error:", (error as Error).message);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });

  /**
   * DELETE /api/v1/vocabulary/:id
   * Soft delete (archive) a vocabulary entry.
   * Refs #24
   */
  router.delete("/:id", async (req: Request, res: Response) => {
    try {
      const entry = await vocabService.softDelete(getParamId(req));
      if (!entry) {
        res.status(404).json({
          success: false,
          error: "Vocabulary entry not found",
        });
        return;
      }

      res.json({
        success: true,
        data: { message: "Entry archived", id: getParamId(req) },
      });
    } catch (error) {
      console.error("Delete error:", (error as Error).message);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });

  return router;
}
