import { z } from "zod";

/**
 * Request-body shapes for controllers/document.controller.ts.
 * lineItemInputSchema doubles as what services/document.service.ts hands to
 * calc/calc.ts's calcLine() — the only extra field is `description`, which
 * calc doesn't need and just ignores.
 */

const discountSchema = z
  .union([
    z.object({
      type: z.literal("fixed"),
      value: z.number().int().nonnegative(),
    }),
    z.object({
      type: z.literal("percent"),
      value: z.number().min(0).max(100),
    }),
  ])
  .nullable();

export const lineItemInputSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPriceCents: z.number().int().min(0, "Unit price cannot be negative"),
  discount: discountSchema.default(null),
  taxPercent: z.number().min(0).max(100).default(0),
});

export const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  customer: z.string().min(1, "Customer is required"),
  issueDate: z.coerce.date(),
  lineItems: z.array(lineItemInputSchema).default([]),
});

export const updateDocumentMetaSchema = z.object({
  title: z.string().min(1).optional(),
  customer: z.string().min(1).optional(),
  issueDate: z.coerce.date().optional(),
});
