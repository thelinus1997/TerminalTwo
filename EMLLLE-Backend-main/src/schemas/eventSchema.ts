import { z } from 'zod';

export const participant = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  hasPaid: z.boolean().optional(),
  isApproved: z.boolean().optional(),
  registrationDate: z.string().optional(),
});

export type Participant = z.infer<typeof participant>;

const registrationOptions = z.object({
  isRegistrationRequired: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  requiresPayment: z.boolean().optional(),
  allowMultipleOptions: z.boolean().optional(),
});

const location = z.object({
  name: z.string(),
  geoLocation: z.object({ long: z.number(), lat: z.number() }).optional(),
});

export const eventSchema = z.object({
  id: z.string().uuid().optional(), // Event ID
  organizationId: z.string().uuid().optional(), // Organization ID
  organizerId: z.string().uuid().optional(), // Organizer ID
  title: z.string().min(1), // Event name
  date: z.string().date(), // The date of the event
  location: location.optional(), // Event location
  description: z.string().min(1), // Event description
  participants: z.array(participant).optional(), // Users that have joined the event
  isPublic: z.boolean(), // Whether the event is public or private
  maxParticipants: z.number().optional(), // Maximum number of participants
  registrationOptions: registrationOptions, // Event options
});

export type Event = z.infer<typeof eventSchema>;

export const editEventSchema = z.object({
  title: z.string().min(1), // Event name
  date: z.string().date(), // The date of the event
  location: location.optional(), // Event location
  description: z.string().min(1), // Event description
  isPublic: z.boolean(), // Whether the event is public or private
  maxParticipants: z.number().optional(), // Maximum number of participants
});

export type EditEvent = z.infer<typeof editEventSchema>;

export const editEventParticipantSchema = z.array(participant).optional();

export type EditEventParticipant = z.infer<typeof editEventParticipantSchema>;
