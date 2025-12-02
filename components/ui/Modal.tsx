'use client';

import { ReactNode, useEffect, useCallback } from 'react';

interface ModalBackdropProps {
  onClick?: () => void;
  onClose?: () => void; // Triggered by ESC key and backdrop click
  children?: ReactNode;
  maxWidth?: string; // Allow custom max-width (default: max-w-md)
}

/**
 * Standard modal backdrop with blur effect.
 * Use this for consistent styling across all modals.
 * Supports ESC key to close when onClose is provided.
 */
export function ModalBackdrop({
  onClick,
  onClose,
  children,
  maxWidth = 'max-w-md',
}: ModalBackdropProps) {
  // Handle ESC key to close modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        (onClose ?? onClick)?.();
      }
    },
    [onClose, onClick]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleBackdropClick = () => {
    (onClose ?? onClick)?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />
      {/* Content container */}
      <div className={`relative z-10 w-full ${maxWidth} mx-4`}>{children}</div>
    </div>
  );
}
