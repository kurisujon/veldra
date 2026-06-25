'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileText, Download, Loader2 } from 'lucide-react'
import { generateExport } from '../actions'

type ExportPackage = {
  id: string
  case_id: string
  package_url: string
  format: string
  created_at: string | null
}

interface ExportWorkspaceProps {
  caseId: string
  exports: ExportPackage[]
}

export function ExportWorkspace({ caseId, exports }: ExportWorkspaceProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async (format: 'PDF' | 'ZIP') => {
    try {
      setIsGenerating(true)
      await generateExport(caseId, format)
    } catch (err) {
      console.error(err)
      alert('Failed to generate export package.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-xl mb-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading font-semibold text-text-primary">Export Package</h2>
          <p className="text-small text-text-secondary mt-xs">
            Generate and download finalized verification reports and legal drafts.
          </p>
        </div>
        <div className="flex gap-md">
          <Button 
            variant="outline" 
            onClick={() => handleGenerate('ZIP')} 
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="mr-sm h-4 w-4 animate-spin" /> : <Download className="mr-sm h-4 w-4" />}
            Export as ZIP
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleGenerate('PDF')} 
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="mr-sm h-4 w-4 animate-spin" /> : <FileText className="mr-sm h-4 w-4" />}
            Generate PDF Report
          </Button>
        </div>
      </div>

      {exports.length > 0 && (
        <Card className="p-xl">
          <h3 className="text-body font-medium text-text-primary mb-md">Generated Exports</h3>
          <div className="flex flex-col gap-sm">
            {exports.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between p-md border border-border-default rounded-md hover:border-brand-primary transition-colors">
                <div className="flex items-center gap-md">
                  <div className="p-sm bg-surface-secondary rounded-md text-text-secondary">
                    {exp.format === 'PDF' ? <FileText size={20} /> : <Download size={20} />}
                  </div>
                  <div>
                    <p className="text-small font-medium text-text-primary">
                      Verification_Report_{exp.format}.{exp.format.toLowerCase()}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Generated on {exp.created_at ? new Date(exp.created_at).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href={exp.package_url} target="_blank" rel="noopener noreferrer">
                    Download
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
