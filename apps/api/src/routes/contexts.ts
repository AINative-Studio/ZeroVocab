import { Router, Request, Response } from "express";
import { ZeroDBClient } from "../clients/zerodb-client";
import { ContextService } from "../services/context-service";
import {
  CreateContextSchema,
  ListContextsQuerySchema,
} from "../schemas/context";

export function createContextRoutes(db: ZeroDBClient): Router {
  const router = Router();
  const service = new ContextService(db);

  /**
   * POST /api/v1/vocabulary/:id/contexts
   * Add context to a vocabulary entry.
   */
  router.post(
    "/api/v1/vocabulary/:id/contexts",
    async (req: Request, res: Response): Promise<void> => {
      try {
        const vocabularyEntryId = req.params.id;
        const parsed = CreateContextSchema.safeParse({
          ...req.body,
          vocabulary_entry_id: vocabularyEntryId,
        });

        if (!parsed.success) {
          res.status(400).json({
            success: false,
            error: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
          });
          return;
        }

        const input = parsed.data;
        let context;

        if (input.context_type === "sentence" && input.original_sentence) {
          context = await service.saveSentenceContext(vocabularyEntryId, {
            original_sentence: input.original_sentence,
            translated_sentence: input.translated_sentence,
            surrounding_text: input.surrounding_text,
          });
        } else if (input.context_type === "page") {
          context = await service.savePageContext(vocabularyEntryId, {
            page_title: input.page_title,
            url: input.url,
            source_application: input.source_application,
          });
        } else {
          context = await service.createContextFromCapture(
            vocabularyEntryId,
            input
          );
        }

        res.status(201).json({ success: true, data: context });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({ success: false, error: message });
      }
    }
  );

  /**
   * GET /api/v1/vocabulary/:id/contexts
   * List all contexts for a vocabulary entry.
   */
  router.get(
    "/api/v1/vocabulary/:id/contexts",
    async (req: Request, res: Response): Promise<void> => {
      try {
        const vocabularyEntryId = req.params.id;
        const parsed = ListContextsQuerySchema.safeParse(req.query);

        if (!parsed.success) {
          res.status(400).json({
            success: false,
            error: "Invalid query parameters",
            details: parsed.error.flatten().fieldErrors,
          });
          return;
        }

        const result = await service.listContexts(
          vocabularyEntryId,
          parsed.data
        );
        res.status(200).json({ success: true, data: result });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({ success: false, error: message });
      }
    }
  );

  /**
   * GET /api/v1/contexts/:id
   * Get a single context by ID.
   */
  router.get(
    "/api/v1/contexts/:id",
    async (req: Request, res: Response): Promise<void> => {
      try {
        const context = await service.getContext(req.params.id);
        if (!context) {
          res.status(404).json({ success: false, error: "Context not found" });
          return;
        }
        res.status(200).json({ success: true, data: context });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({ success: false, error: message });
      }
    }
  );

  /**
   * DELETE /api/v1/contexts/:id
   * Delete a context.
   */
  router.delete(
    "/api/v1/contexts/:id",
    async (req: Request, res: Response): Promise<void> => {
      try {
        await service.deleteContext(req.params.id);
        res.status(204).send();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({ success: false, error: message });
      }
    }
  );

  return router;
}
