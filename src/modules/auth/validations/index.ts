import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// NOTE: phone validation is performed country-aware via validateNationalPhone()
// from @/lib/phone before any signUp() or DB call (Task 158). The previous
// Albania-only regex /^(\+355|0)[0-9]{8,9}$/ is removed — it conflicted with
// the canonical multi-country validator and was imported nowhere.
export const registerSchema = z.object({
  name: z.string().min(2).max(100).transform(v => v.trim()),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  user_type: z.enum(['private', 'agent']),
  company_name: z.string().max(200).optional().transform(v => v?.trim() || undefined),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
