'use client'

import React from 'react';
import { Modal } from './index';
import { Button } from '../Button';
import { Loader2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  isDeleting?: boolean;
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, message, isDeleting }: ConfirmDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-body text-text-secondary mb-lg">{message}</p>
      <div className="flex justify-end gap-md">
        <Button variant="ghost" onClick={onClose} disabled={isDeleting}>Cancel</Button>
        <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? <Loader2 className="mr-sm h-4 w-4 animate-spin" /> : null}
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </Modal>
  );
}
