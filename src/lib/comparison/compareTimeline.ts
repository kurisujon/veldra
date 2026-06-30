import { DocumentField, Discrepancy } from './types'
import { generateFindingDescription } from './formatters'

export function compareTimeline(fields: DocumentField[]): Discrepancy[] {
  const discrepancies: Discrepancy[] = []
  
  const timelineFields = fields.filter(f => {
    const fn = f.field_name.toLowerCase()
    return fn.includes('year') || fn.includes('timeline') || fn.includes('graduation') || fn.includes('institution')
  })
  
  const grouped = timelineFields.reduce((acc, field) => {
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
        if (firstVal.trim() !== otherVal.trim()) {
          discrepancies.push({
            title: `${fieldName} Mismatch`,
            description: generateFindingDescription(fieldName, firstVal, otherVal, 'School Gap'),
            category: 'School Gap',
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
