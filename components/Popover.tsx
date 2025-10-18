import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';

interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  position?: 'bottom-start' | 'top-start' | 'right-start' | 'bottom-end' | 'top-end';
  className?: string;
}

export const Popover: React.FC<PopoverProps> = ({ isOpen, onClose, triggerRef, children, position = 'bottom-start', className }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const calculatePosition = useCallback(() => {
    if (triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popoverHeight = popoverRef.current?.offsetHeight || 0;
      
      const newStyle: any = {
        position: 'fixed',
      };

      const margin = 4;

      switch (position) {
        case 'top-start':
          newStyle.top = triggerRect.top - popoverHeight - margin;
          newStyle.left = triggerRect.left;
          break;
        case 'top-end':
          newStyle.top = triggerRect.top - popoverHeight - margin;
          newStyle.right = window.innerWidth - triggerRect.right;
          break;
        case 'right-start':
          newStyle.top = triggerRect.top;
          newStyle.left = triggerRect.right + margin;
          break;
        case 'bottom-end':
           newStyle.top = triggerRect.bottom + margin;
           newStyle.right = window.innerWidth - triggerRect.right;
           break;
        default: // 'bottom-start'
          newStyle.top = triggerRect.bottom + margin;
          newStyle.left = triggerRect.left;
          break;
      }
      setStyle(newStyle);
    }
  }, [triggerRef, position]);
  
  // Use a layout effect to calculate position after the popover has rendered and we know its size.
  // This prevents the flicker on first open, especially for 'top-start'.
  useEffect(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen, calculatePosition, children]);


  useEffect(() => {
    if (isOpen) {
      window.addEventListener('resize', calculatePosition);
      window.addEventListener('scroll', calculatePosition, true); // capture phase
    }
    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
        ref={popoverRef}
        style={style}
        className={`z-50 ${className}`}
        onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
};