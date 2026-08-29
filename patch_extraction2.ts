import fs from 'fs';

const path = 'src/lib/ai/extraction.ts';
let code = fs.readFileSync(path, 'utf8');

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

if (!code.includes('const evidenceContext = evidenceMap')) {
    code = code.replace(
        'const ocrDurationMs = Date.now() - ocrStart;', 
        'const ocrDurationMs = Date.now() - ocrStart;\n\n' + missingEvidenceMap
    );
}

fs.writeFileSync(path, code);
