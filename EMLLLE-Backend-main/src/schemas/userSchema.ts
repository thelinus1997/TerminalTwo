import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid().optional(),
  username: z.string().min(3),
  firstName: z.string().min(3),
  lastName: z.string().min(3),
  password: z.string().min(6),
});

export type User = z.infer<typeof userSchema>;
