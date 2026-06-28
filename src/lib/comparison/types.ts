export interface DocumentField {
  id: string
  case_id: string
  document_id: string
  field_name: string
  raw_value: string | null
  normalized_value: string | null
  reviewed_value: string | null
  final_value: string | null
  confidence_score: number | null
  created_at: string
  updated_at: string
}

export interface Discrepancy {
  title: string
  description: string
  category: 'Name Mismatch' | 'Address Mismatch' | 'Date Mismatch' | 'Age Calculation Issue' | 'School Gap' | 'Missing Information'
  severity: 'High' | 'Medium' | 'Low'
  fieldA: DocumentField
  fieldB: DocumentField
}
