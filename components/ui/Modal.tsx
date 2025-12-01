'use client';

import { ReactNode } from 'react';

interface ModalBackdropProps {
  onClick?: () => void;
  children?: ReactNode;
}

/**
 * Standard modal backdrop with blur effect.
 * Use this for consistent styling across all modals.
 */
export function ModalBackdrop({ onClick, children }: ModalBackdropProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClick} />
      {/* Content container */}
      <div className="relative z-10 w-full max-w-md mx-4">{children}</div>
    </div>
  );
}
