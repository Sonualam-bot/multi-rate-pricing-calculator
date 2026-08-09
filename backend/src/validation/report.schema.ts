import { z } from "zod";

export const reportQuerySchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .refine((data) => data.from <= data.to, {
    message: "'from' date must be before or equal to 'to' date",
    path: ["from"],
  });
