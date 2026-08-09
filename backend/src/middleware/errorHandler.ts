import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { AppError } from "../errors";
import { InvalidDiscountError } from "../calc/calc";

/**
 * The one place a thrown error becomes an HTTP response. Knows about
 * errors.ts's AppError family, calc/calc.ts's InvalidDiscountError, Zod's
 * validation errors, and Mongoose's CastError (bad ObjectId in a URL) —
 * anything else falls through to a plain 500. Mounted last in index.ts,
 * after every route, since Express only routes errors to middleware
 * registered after the one that called next(err).
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
  }
  if (err instanceof InvalidDiscountError) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: "Invalid id format" });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
};
