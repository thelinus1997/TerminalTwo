import { z } from 'zod';

const location = z.object({
  name: z.string(),
  geoLocation: z.object({ long: z.number(), lat: z.number() }).optional(),
});

const registrationOptions = z.object({
  isRegistrationRequired: z.boolean(),
  requiresApproval: z.boolean(),
  requiresPayment: z.boolean(),
  allowMultipleOptions: z.boolean(),
});

const eventSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  date: z.string().date(),
  location: location.optional(),
  isPublic: z.boolean(),
  participants: z.number().optional(),
  requests: z.number().optional(),
  registrationOptions: registrationOptions,
});

export const organizationSchema = z.object({
  name: z.string().min(3),
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  events: z.array(eventSchema).optional(),
});

export type Organization = z.infer<typeof organizationSchema>;
