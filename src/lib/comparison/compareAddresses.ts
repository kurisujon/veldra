import { DocumentField, Discrepancy } from './types'
import { generateFindingDescription } from './formatters'

export function compareAddresses(fields: DocumentField[]): Discrepancy[] {
  const discrepancies: Discrepancy[] = []
  
  const addressFields = fields.filter(f => {
    const fn = f.field_name.toLowerCase()
    return fn.includes('address') || fn.includes('city') || fn.includes('province') || fn.includes('office')
  })
  
  const grouped = addressFields.reduce((acc, field) => {
    if (!acc[field.field_name]) acc[field.field_name] = []
    acc[field.field_name].push(field)
    return acc
  }, {} as Record<string, DocumentField[]>)
  
  for (const fieldName of Object.keys(grouped)) {
    const group = grouped[fieldName]
    if (group.length < 2) continue
    
    const firstField = group[0]
    const firstVal = firstField.final_value || firstField.reviewed_value || firstField.normalized_value || firstField.raw_value
    
    for (let i = 1; i < group.length; i++) {
      const otherField = group[i]
      const otherVal = otherField.final_value || otherField.reviewed_value || otherField.normalized_value || otherField.raw_value
      
      if (firstVal && otherVal) {
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
        
        if (normalize(firstVal) !== normalize(otherVal)) {
          discrepancies.push({
            title: `${fieldName} Mismatch`,
            description: generateFindingDescription(fieldName, firstVal, otherVal, 'Address Mismatch'),
            category: 'Address Mismatch',
            severity: 'Medium',
            fieldA: firstField,
            fieldB: otherField
          })
          break
        }
      }
    }
  }
  
  return discrepancies
}
