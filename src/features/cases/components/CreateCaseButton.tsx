'use client'
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CreateCaseModal } from './CreateCaseModal';

export function CreateCaseButton() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>New Case</Button>
      <CreateCaseModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
