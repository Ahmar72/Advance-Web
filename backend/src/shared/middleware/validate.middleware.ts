import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Middleware to validate request body, query, or params against a Zod schema
 * Usage: validateRequest(schema, 'body | query | params')
 */
export const validateRequest =
  (schema: ZodSchema, source: "body" | "query" | "params" = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dataToValidate = {
        body: req.body,
        query: req.query,
        params: req.params,
      };

      const validation = schema.safeParse(dataToValidate[source]);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        });
        return;
      }

      // Replace the data source with validated data
      if (source === "body") req.body = validation.data;
      if (source === "query") req.query = validation.data;
      if (source === "params") req.params = validation.data;

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Request validation error",
      });
    }
  };
