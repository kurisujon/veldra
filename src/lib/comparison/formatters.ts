export function formatFieldName(camelCaseStr: string): string {
  // Convert camelCase to space-separated words
  let formatted = camelCaseStr.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  
  // Clean up common prefixes
  formatted = formatted.replace(/^student\s*/, '');
  formatted = formatted.replace(/^applicant\s*/, '');
  
  return formatted;
}

export function generateFindingDescription(
  fieldName: string, 
  firstVal: string, 
  otherVal: string, 
  category: string
): string {
  const formattedField = formatFieldName(fieldName);
  
  switch (category) {
    case 'Name Mismatch':
      return `The applicant's <strong>${formattedField}</strong> is not consistent across the submitted documents. One document shows <strong>"${firstVal}"</strong>, while another shows <strong>"${otherVal}"</strong>. Please verify the correct spelling before proceeding.`;
      
    case 'Date Mismatch':
      return `The applicant's <strong>${formattedField}</strong> is inconsistent across the submitted documents. One record indicates <strong>"${firstVal}"</strong>, while another indicates <strong>"${otherVal}"</strong>. Please verify the correct date.`;
      
    case 'Address Mismatch':
      return `The applicant's <strong>${formattedField}</strong> is not consistent across the submitted documents. One document lists <strong>"${firstVal}"</strong>, while another lists <strong>"${otherVal}"</strong>. Please verify the correct address or determine whether supporting documentation is required.`;
      
    case 'School Gap':
      return `The <strong>${formattedField}</strong> listed on the academic documents is inconsistent. One document shows <strong>"${firstVal}"</strong>, while another shows <strong>"${otherVal}"</strong>. Please verify the correct institution information.`;
      
    default:
      if (formattedField.includes('office') || formattedField.includes('registry')) {
        return `The <strong>${formattedField}</strong> recorded on the submitted documents is inconsistent. One document indicates <strong>"${firstVal}"</strong>, while another indicates <strong>"${otherVal}"</strong>. Please verify whether the documents were issued by the appropriate registry office.`;
      }
      
      return `The <strong>${formattedField}</strong> is not consistent across the submitted documents. One document shows <strong>"${firstVal}"</strong>, while another shows <strong>"${otherVal}"</strong>. Please verify the correct information.`;
  }
}
