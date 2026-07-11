'use client'

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { CaseStatusBadge } from '@/features/cases/components/CaseStatusBadge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, Search, ChevronDown, Check, Trash2, AlertCircle, X, CheckCircle } from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/ui/Modal/ConfirmDeleteModal';
import { moveToTrashCase } from '@/features/cases/actions';
const ITEMS_PER_PAGE = 10;

export function CaseList({ initialCases }: { initialCases: any[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [animatingOutId, setAnimatingOutId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'NeedsReview', label: 'Needs Review' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Reviewed', label: 'Reviewed' },
    { value: 'ReadyForExport', label: 'Ready for Export' },
    { value: 'Exported', label: 'Exported' }
  ];

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.status-dropdown')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredCases = useMemo(() => {
    return initialCases.filter((c) => {
      const applicant = c.applicants?.[0] || {};
      const fullName = `${applicant.first_name || ''} ${applicant.middle_name ? applicant.middle_name + ' ' : ''}${applicant.last_name || ''}`.toLowerCase();
      const idStr = c.id.toLowerCase();
      const q = searchQuery.toLowerCase();
      
      const matchesSearch = fullName.includes(q) || idStr.includes(q);
      const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [initialCases, searchQuery, filterStatus]);

  const totalPages = Math.ceil(filteredCases.length / ITEMS_PER_PAGE) || 1;
  
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedCases = filteredCases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex flex-col gap-md relative">
      {/* Floating Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-sm pointer-events-none">
        {error && (
          <div className="bg-white border-l-4 border-error shadow-lg rounded-md p-md flex items-start gap-md animate-in slide-in-from-right-8 pointer-events-auto min-w-[300px]">
            <AlertCircle className="text-error mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-small font-semibold text-text-primary">Error</h4>
              <p className="text-small text-text-secondary mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-text-secondary hover:text-text-primary">
              <X size={16} />
            </button>
          </div>
        )}
        {message && (
          <div className="bg-white border-l-4 border-success shadow-lg rounded-md p-md flex items-start gap-md animate-in slide-in-from-right-8 pointer-events-auto min-w-[300px]">
            <CheckCircle className="text-success mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-small font-semibold text-text-primary">Success</h4>
              <p className="text-small text-text-secondary mt-0.5">{message}</p>
            </div>
            <button onClick={() => setMessage(null)} className="text-text-secondary hover:text-text-primary">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-md mb-sm flex-wrap">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
          <Input 
            placeholder="Search cases by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative status-dropdown z-20">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between min-w-[160px] rounded-input border border-text-secondary/20 bg-surface px-md py-sm text-body transition-all hover:bg-background focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <span>{statusOptions.find(opt => opt.value === filterStatus)?.label}</span>
            <ChevronDown size={16} className={cn("text-text-secondary transition-transform duration-200", isDropdownOpen && "rotate-180")} />
          </button>
          
          <div 
            className={cn(
              "absolute right-0 top-full mt-sm w-full min-w-[180px] origin-top-right rounded-card border border-text-secondary/10 bg-surface shadow-modal transition-all duration-200 ease-out",
              isDropdownOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            )}
          >
            <div className="p-xs flex flex-col gap-[2px]">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setFilterStatus(opt.value);
                    setIsDropdownOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between w-full px-md py-sm rounded-button text-left text-body transition-colors hover:bg-background",
                    filterStatus === opt.value ? "bg-accent/10 text-accent font-medium" : "text-text-primary"
                  )}
                >
                  {opt.label}
                  {filterStatus === opt.value && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredCases.length === 0 ? (
        <Card className="p-xl text-center text-text-secondary">
          No cases found matching your criteria.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
          {paginatedCases.map((c) => (
            <Link 
              key={c.id} 
              href={`/cases/${c.id}`} 
              className={cn(
                "group transition-all duration-300 origin-top h-full",
                animatingOutId === c.id ? "opacity-0 scale-95 h-0 overflow-hidden mb-[-16px]" : "opacity-100 scale-100"
              )}
            >
              <Card className="flex flex-col p-lg transition-all hover:bg-background hover:shadow-md hover:-translate-y-1 gap-md h-full">
                <div className="flex flex-col items-start gap-xs flex-1">
                  <div className="flex w-full items-start justify-between">
                    <CaseStatusBadge status={c.status} />
                  </div>
                  <h3 className="text-heading font-semibold text-text-primary mt-sm line-clamp-1">
                    {c.applicants?.[0]?.first_name} {c.applicants?.[0]?.middle_name ? c.applicants[0].middle_name + ' ' : ''}{c.applicants?.[0]?.last_name}
                  </h3>
                </div>
                <div className="flex items-center justify-between text-small text-text-secondary pt-md border-t border-text-secondary/10 w-full mt-auto">
                  <span>Created on {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <button 
                    className="p-sm rounded-md text-text-secondary hover:text-error hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Move to Trash"
                    onClick={(e) => {
                      e.preventDefault();
                      setCaseToDelete(c.id);
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-text-secondary/10 pt-md mt-md">
          <p className="text-small text-text-secondary">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredCases.length)} of {filteredCases.length} entries
          </p>
          <div className="flex items-center gap-sm">
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
              <span className="sr-only">Previous</span>
            </Button>
            <span className="text-small font-medium text-text-primary px-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
      )}

      <ConfirmDeleteModal 
        isOpen={!!caseToDelete}
        onClose={() => setCaseToDelete(null)}
        title="Delete Case"
        message="Are you sure you want to move this case to the trash? You can restore it later from the Trash page."
        isDeleting={isDeleting}
        onConfirm={async () => {
          if (!caseToDelete) return;
          setIsDeleting(true);
          setError(null);
          setMessage(null);
          try {
            await moveToTrashCase(caseToDelete);
            setMessage('Case moved to trash successfully.');
            setCaseToDelete(null);
          } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to move case to trash.');
          } finally {
            setIsDeleting(false);
          }
        }}
      />
    </div>
  );
}
