import { Router, Request, Response } from "express";
import { ZodError } from "zod";
import { UserService } from "../services/user-service";
import { ZeroDBClient } from "../clients/zerodb-client";

function getParamId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

export function createUserRouter(db: ZeroDBClient): Router {
  const router = Router();
  const userService = new UserService(db);

  // POST /api/v1/users - Create user profile (Refs #17)
  router.post("/", async (req: Request, res: Response) => {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }
      res.status(500).json({ success: false, error: "Failed to create user" });
    }
  });

  // GET /api/v1/users/:id - Get user profile (Refs #17)
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const user = await userService.getUser(getParamId(req));
      if (!user) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
      }
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to get user" });
    }
  });

  // PATCH /api/v1/users/:id - Update user profile (Refs #17)
  router.patch("/:id", async (req: Request, res: Response) => {
    try {
      const user = await userService.updateUser(getParamId(req), req.body);
      if (!user) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
      }
      res.json({ success: true, data: user });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }
      res.status(500).json({ success: false, error: "Failed to update user" });
    }
  });

  // PATCH /api/v1/users/:id/languages - Configure learning languages (Refs #18)
  router.patch("/:id/languages", async (req: Request, res: Response) => {
    try {
      const user = await userService.updateLanguages(getParamId(req), req.body);
      if (!user) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
      }
      res.json({ success: true, data: user });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }
      res
        .status(500)
        .json({ success: false, error: "Failed to update languages" });
    }
  });

  // PATCH /api/v1/users/:id/preferences - Manage learning preferences (Refs #19)
  router.patch("/:id/preferences", async (req: Request, res: Response) => {
    try {
      const user = await userService.updatePreferences(
        getParamId(req),
        req.body
      );
      if (!user) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
      }
      res.json({ success: true, data: user });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }
      res
        .status(500)
        .json({ success: false, error: "Failed to update preferences" });
    }
  });

  return router;
}
