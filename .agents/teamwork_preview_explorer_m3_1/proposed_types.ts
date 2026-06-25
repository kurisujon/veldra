import type { Database } from '@/types/database'

export type Document = Database['public']['Tables']['documents']['Row']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type DocumentUpdate = Database['public']['Tables']['documents']['Update']

// Strict type-safe enum for frontend and validation alignment
export type DocumentType = 'PSABirth' | 'PSAMarriage' | 'TOR' | 'SF10' | 'Diploma'

export interface UploadResponse {
  success: boolean
  data?: Document
  error?: string
}

export interface DeleteResponse {
  success: boolean
  error?: string
}

export interface GetDocumentsResponse {
  success: boolean
  data?: Document[]
  error?: string
}
