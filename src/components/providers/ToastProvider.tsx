"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster 
      position="top-right"
      toastOptions={{
        className: 'border border-text-secondary/20 rounded-button bg-surface text-body font-medium',
        style: {
          background: 'var(--surface)',
          color: 'var(--text-primary)',
        },
        success: {
          iconTheme: {
            primary: 'var(--success)',
            secondary: 'var(--surface)',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--error)',
            secondary: 'var(--surface)',
          },
        },
      }}
    />
  );
}
