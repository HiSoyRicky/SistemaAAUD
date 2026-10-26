// Modal.jsx

import { X } from 'lucide-react';
import { useEffect } from 'react';
import ModalLayer from './ModalLayer';

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  constrainToViewport = false,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape' && showCloseButton) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose, showCloseButton]);

  if (!open) {
    return null;
  }

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <ModalLayer>
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-4 bg-black/55 backdrop-blur-md ${constrainToViewport ? 'overscroll-contain' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`w-full ${sizeClasses[size] || sizeClasses.md} overflow-hidden bg-white rounded-xl shadow-2xl ${constrainToViewport ? 'flex max-h-[calc(100dvh-2rem)] flex-col' : ''}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex shrink-0 items-center justify-between px-6 py-4 border-b">
            {title ? (
              <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                {title}
              </h2>
            ) : (
              <div />
            )}

            {showCloseButton && (
              <button
                type="button"
                onClick={() => onClose?.()}
                className="p-1 text-gray-400 transition rounded-lg hover:text-gray-600 hover:bg-gray-100"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        <div className={`px-6 py-5 ${constrainToViewport ? 'min-h-0 overflow-y-auto overscroll-contain' : ''}`}>{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
    </ModalLayer>
  );
}
