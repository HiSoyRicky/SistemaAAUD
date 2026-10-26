import { useEffect } from 'react';
import { createPortal } from 'react-dom';

let activeLayers = 0;
let previousStyles = null;

export default function ModalLayer({ children }) {
  useEffect(() => {
    if (activeLayers === 0) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      previousStyles = {
        htmlOverflow: document.documentElement.style.overflow,
        bodyOverflow: document.body.style.overflow,
        bodyPaddingRight: document.body.style.paddingRight,
      };
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    activeLayers += 1;
    return () => {
      activeLayers = Math.max(0, activeLayers - 1);
      if (activeLayers === 0 && previousStyles) {
        document.documentElement.style.overflow = previousStyles.htmlOverflow;
        document.body.style.overflow = previousStyles.bodyOverflow;
        document.body.style.paddingRight = previousStyles.bodyPaddingRight;
        previousStyles = null;
      }
    };
  }, []);

  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
