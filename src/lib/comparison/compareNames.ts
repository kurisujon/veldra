import { DocumentField, Discrepancy } from './types'

export function compareNames(fields: DocumentField[]): Discrepancy[] {
  const discrepancies: Discrepancy[] = []
  
  const nameFields = fields.filter(f => f.field_name.toLowerCase().includes('name'))
  
  const grouped = nameFields.reduce((acc, field) => {
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
            description: `The '${fieldName}' values do not match across documents ("${firstVal}" vs "${otherVal}").`,
            category: 'Name Mismatch',
            severity: 'High',
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
