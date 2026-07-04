'use client'

import { useState, useMemo } from 'react'
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { FileText, Search } from "lucide-react"
import Link from "next/link"

export function ExportsList({ exports }: { exports: any[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filteredExports = useMemo(() => {
    return exports.filter((exp) => {
      const applicant = exp.cases?.applicants?.[0]
      const applicantName = applicant ? `${applicant.first_name} ${applicant.last_name}`.toLowerCase() : ""
      const title = (exp.title || 'Verification Report').toLowerCase()
      const q = searchQuery.toLowerCase()
      const matchesSearch = applicantName.includes(q) || title.includes(q)
      
      let matchesDate = true
      const expDate = exp.generated_at ? new Date(exp.generated_at) : new Date(exp.created_at)
      
      if (expDate) {
        if (dateFrom) {
          const from = new Date(dateFrom)
          if (expDate < from) matchesDate = false
        }
        if (dateTo) {
          const to = new Date(dateTo)
          to.setHours(23, 59, 59, 999)
          if (expDate > to) matchesDate = false
        }
      }
      
      return matchesSearch && matchesDate
    })
  }, [exports, searchQuery, dateFrom, dateTo])

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-col sm:flex-row gap-md mb-md">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
          <Input 
            placeholder="Search exports by applicant or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-sm">
          <label className="text-small text-text-secondary">From:</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <label className="text-small text-text-secondary">To:</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <Card className="p-xl min-h-[400px]">
        {filteredExports.length > 0 ? (
          <div className="flex flex-col gap-md">
            {filteredExports.map((exp: any) => {
              const applicant = exp.cases?.applicants?.[0];
              const applicantName = applicant ? `${applicant.first_name} ${applicant.last_name}` : "Unknown Applicant";
              
              return (
                <div key={exp.id} className="flex flex-col md:flex-row md:items-center justify-between p-md border border-text-secondary/10 rounded-button hover:bg-background transition-colors gap-md">
                  <div className="flex items-center gap-md">
                    <div className="p-sm bg-surface-secondary rounded-md text-text-secondary">
                      <FileText size={20} />
                    </div>
                    <div>
                      <Link href={`/cases/${exp.case_id}`} className="text-body font-medium text-accent hover:underline">
                        {applicantName} - {exp.title || 'Verification Report'}
                      </Link>
                      <p className="text-small text-text-secondary">
                        Generated on: {exp.generated_at ? new Date(exp.generated_at).toLocaleString() : new Date(exp.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-sm">
                    {exp.pdf_path && (
                      <a 
                        href={exp.pdf_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-button px-md py-sm text-small font-semibold bg-surface-secondary text-text-primary hover:bg-border-default transition-colors"
                      >
                        📄 Download PDF
                      </a>
                    )}
                    {exp.docx_path && (
                      <a 
                        href={exp.docx_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-button px-md py-sm text-small font-semibold bg-surface-secondary text-text-primary hover:bg-border-default transition-colors"
                      >
                        📝 Download DOCX
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-text-secondary mt-xl flex flex-col items-center gap-md">
            <FileText className="w-12 h-12 text-text-secondary/50" />
            <p>No exports match your search criteria.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
