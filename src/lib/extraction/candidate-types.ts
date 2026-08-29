import { z } from 'zod';

export const CandidateFieldStateSchema = z.enum([
  'candidate',
  'not_present',
  'unreadable',
  'ambiguous'
]);

export const CandidateFieldSchema = z.object({
  value: z.string().nullable(),
  state: CandidateFieldStateSchema,
  evidenceSpanIds: z.array(z.string()).default([])
});

export type CandidateFieldState = z.infer<typeof CandidateFieldStateSchema>;
export type CandidateField = z.infer<typeof CandidateFieldSchema>;
