import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const brandSignupStep1Schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  brandName: z.string().min(2, 'Brand name is required'),
  primaryDomain: z.string().min(3, 'Enter a valid domain'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const brandSignupStep2Schema = z.object({
  categories: z.array(z.string()).min(1, 'Select at least one category'),
  marketplaceUrls: z.array(z.string().url()).min(1, 'Add at least one marketplace URL'),
  trademarkNumber: z.string().optional(),
})

export const vendorSignupSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  businessName: z.string().min(2, 'Business name is required'),
  passportId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const addVendorSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  tier: z.string().min(1, 'Select a tier'),
  skuScope: z.string().optional(),
})

export const applicationSchema = z.object({
  tier: z.string().min(1, 'Select a tier'),
  channels: z.array(z.string()).min(1, 'Select at least one channel'),
  skuScope: z.string().optional(),
  message: z.string().optional(),
})

export const tierSchema = z.object({
  name: z.string().min(1, 'Tier name is required'),
  description: z.string().min(1, 'Description is required'),
  channels: z.array(z.string()).min(1, 'Select at least one channel'),
})

export const webhookSchema = z.object({
  url: z.string().url('Enter a valid HTTPS URL').startsWith('https', 'URL must use HTTPS'),
  events: z.array(z.string()).min(1, 'Select at least one event'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type BrandSignupStep1Input = z.infer<typeof brandSignupStep1Schema>
export type BrandSignupStep2Input = z.infer<typeof brandSignupStep2Schema>
export type VendorSignupInput = z.infer<typeof vendorSignupSchema>
export type AddVendorInput = z.infer<typeof addVendorSchema>
export type ApplicationInput = z.infer<typeof applicationSchema>
export type TierInput = z.infer<typeof tierSchema>
export type WebhookInput = z.infer<typeof webhookSchema>
