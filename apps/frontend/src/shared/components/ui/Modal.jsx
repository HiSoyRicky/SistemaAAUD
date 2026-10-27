// Modal.jsx

import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
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
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const focusable = () => [...dialog.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter((element) => element.getClientRects().length > 0);
    (focusable()[0] || dialog).focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showCloseButton) {
        event.preventDefault();
        closeRef.current?.();
      } else if (event.key === 'Tab') {
        const elements = focusable();
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (!first) {
          event.preventDefault();
          dialog.focus();
        } else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open, showCloseButton]);

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
      ref={dialogRef}
      tabIndex={-1}
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      <div
        className={`w-full ${sizeClasses[size] || sizeClasses.md} max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-xl shadow-2xl ${constrainToViewport ? 'flex flex-col' : ''}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex shrink-0 items-center justify-between px-6 py-4 border-b">
            {title ? (
              <h2 id={titleId} className="text-lg font-semibold text-gray-900">
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
