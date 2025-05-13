import { z } from "zod";

// ----------------------------------------------------------------------

export const blinkFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  image_url: z.string().url().min(1, "Image URL is required"),
  description: z.string().min(1, "Description is required"),
  label: z.string().min(1, "Label is required"),
  amount: z
    .array(
      z.object({
        value: z.number().min(0.1, "Amount must be greater than 0"),
      })
    )
    .min(1, "At least one amount is required"),
  isCustomInput: z.boolean().default(false),
});

export type BlinkFormSchema = z.infer<typeof blinkFormSchema>;
