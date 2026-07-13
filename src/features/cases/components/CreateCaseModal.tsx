'use client'
import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2 } from 'lucide-react';
import { createCase } from '../actions';
import { useRouter } from 'next/navigation';

export function CreateCaseModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    try {
      const newCase = await createCase(formData);
      router.push(`/cases/${newCase.id}`);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Case">
      <form onSubmit={handleSubmit} className="flex flex-col gap-md">
        {error && <div className="text-small text-error bg-error/10 p-sm rounded-input">{error}</div>}
        <div>
          <label className="mb-xs block text-small font-medium text-text-secondary">First Name</label>
          <Input name="firstName" required placeholder="Juan" />
        </div>
        <div>
          <label className="mb-xs block text-small font-medium text-text-secondary">Middle Name / Initial (Optional)</label>
          <Input name="middleName" placeholder="T." />
        </div>
        <div>
          <label className="mb-xs block text-small font-medium text-text-secondary">Last Name</label>
          <Input name="lastName" required placeholder="Dela Cruz" />
        </div>

        <div className="mt-md flex justify-end gap-sm">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading} className="flex items-center gap-sm">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Creating...' : 'Create Case'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
