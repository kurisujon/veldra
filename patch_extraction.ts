import fs from 'fs';

const path = 'src/lib/ai/extraction.ts';
let code = fs.readFileSync(path, 'utf8');

// Ensure evidence context logic is present
const missingEvidenceMap = `  // ── 11.6-D Bridging: Convert legacy OCR to CanonicalEvidenceMap ────────
  // This satisfies the new Zero-Trust architecture while preserving legacy OCR.

  const canonicalMap: CanonicalEvidenceMap = {
    fullText: ocrResult.fullText,
    pages: [{
      pageNumber: 1,
      width: 1000,
      height: 1000,
      blocks: ocrResult.fullText.split('\\n').filter(l => l.trim()).map((line, i) => ({
        id: \`span_\${i}\`,
        text: line,
        normalizedText: line.trim().toLowerCase(),
        boundingBox: { x: 0, y: 0, width: 0, height: 0 },
        confidence: ocrResult.averageConfidence ?? 0.9,
        type: 'line'
      }))
    }],
    averageConfidence: ocrResult.averageConfidence ?? 0.9,
    provider: ocrResult.engine,
    processingDurationMs: ocrResult.processingDurationMs ?? 0
  };

  const evidenceMap = EvidenceMap.fromCanonicalProviderMap(input.documentId, canonicalMap, [input.documentId]);
  const evidenceContext = evidenceMap.getAllSpans().map(s => 
    \`SPAN_ID: \${s.id}\\nPAGE: \${s.pageId}\\nTYPE: \${s.blockType}\\nTEXT: \${s.text}\\nOCR_CONFIDENCE: \${(s.ocrConfidence ?? 0.9).toFixed(2)}\\n\`
  ).join('\\n');`;

if (!code.includes('CanonicalEvidenceMap')) {
    code = code.replace(
        'const ocrDurationMs = Date.now() - ocrStart;', 
        'const ocrDurationMs = Date.now() - ocrStart;\n\n' + missingEvidenceMap
    );
}

// Ensure the prompt uses evidenceContext
code = code.replace(
    'const prompt = buildProfilePrompt(profile, ocrResult.fullText);',
    'const prompt = buildProfilePrompt(profile, evidenceContext);'
);

// Replace Step 4 and 5 with the zero-trust ones
const step4and5ZeroTrust = `  // ── Step 4: Convert CandidateField to Legacy ExtractedField ────────────
  // This maps the 11.6-D zero-trust state back to the legacy state machine
  // so \`validateEvidence\` and downstream systems continue working.
  let fields: Record<string, ExtractedField> = {};
  for (const [fieldName, evidence] of Object.entries(parsedJson)) {
    if (fieldName === 'documentType') continue;

    // 11.6-D Step 7: Candidate Validation
    const spanIds = evidence.evidenceSpanIds || [];
    
    // Validate that every returned span actually exists in the canonical map
    for (const spanId of spanIds) {
      if (!evidenceMap.hasSpan(spanId)) {
        throw new ExtractionError(
          'GEMINI_FABRICATED_EVIDENCE',
          \`AI returned fabricated span ID: \${spanId}. This violates Zero-Trust constraints.\`,
          { retryable: true }
        );
      }
    }

    // Enforce state logic correctly
    if (evidence.state === 'not_present' && spanIds.length > 0) {
      throw new ExtractionError(
        'GEMINI_INVALID_RESPONSE',
        \`AI returned state 'not_present' but supplied evidence spans.\`,
        { retryable: true }
      );
    }
    
    if (evidence.state === 'candidate' && spanIds.length === 0) {
      throw new ExtractionError(
        'GEMINI_INVALID_RESPONSE',
        \`AI returned state 'candidate' but supplied zero evidence spans.\`,
        { retryable: true }
      );
    }

    // Resolve exactly the spans Gemini referenced
    const resolvedText = evidenceMap.getTextForSpans(spanIds);

    // Translate zero-trust 'state' to legacy 'status'
    let legacyStatus: 'verified' | 'uncertain' | 'missing' | 'unreadable' = 'uncertain';
    if (evidence.state === 'candidate') legacyStatus = 'verified'; // We assume verified until Validator catches it
    else if (evidence.state === 'not_present') legacyStatus = 'missing';
    else if (evidence.state === 'unreadable') legacyStatus = 'unreadable';
    else legacyStatus = 'uncertain';

    fields[fieldName] = {
      value: evidence.value ?? null,
      sourceText: resolvedText.length > 0 ? resolvedText : null,
      page: 1, // Currently mocked via our shim above
      confidence: legacyStatus === 'verified' ? 0.95 : null,
      status: legacyStatus,
      boundingBox: null,
      state: evidence.state,
      evidenceSpanIds: evidence.evidenceSpanIds || [],
    };
  }

  // ── Step 5: Deterministic Evidence Validation ────────────────────────────
  // Pass the Canonical Evidence Map to the Phase 11.6-E Evidence Validator.
  const evidenceResult = validateEvidence(fields, evidenceMap, input.documentId);
  
  // Apply deterministic validation results back to fields
  fields = evidenceResult.fields;`;

// Find Step 4 until Step 6
const step4Regex = /\/\/ ── Step 4: Convert to ExtractedField Records ────────────────────────────[\s\S]*?\/\/ ── Step 6: Normalization ────────────────────────────────────────────────/m;

if (step4Regex.test(code)) {
    code = code.replace(step4Regex, step4and5ZeroTrust + '\n\n  // ── Step 6: Normalization ────────────────────────────────────────────────');
}

fs.writeFileSync(path, code);
