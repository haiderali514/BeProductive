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
    <div ref={popoverRef} style={style} className={`z-50 ${className}`}>
      {children}
    </div>,
    document.body
  );
};

// FEAT: Added and exported a new DatePickerPopover component to resolve circular dependency issues.
export const DatePickerPopover: React.FC<{
    selectedDate: Date | null;
    onDateChange: (date: Date | null) => void;
    onClose: () => void;
}> = ({ selectedDate, onDateChange, onClose }) => {
    const [viewDate, setViewDate] = useState(selectedDate || new Date());

    const monthName = viewDate.toLocaleString('default', { month: 'long' });
    const year = viewDate.getFullYear();
    const daysInMonth = new Date(year, viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, viewDate.getMonth(), 1).getDay(); // 0 = Sunday

    const changeMonth = (offset: number) => {
        setViewDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(1);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };

    const handleDayClick = (day: number) => {
        const newDate = new Date(viewDate);
        newDate.setDate(day);
        onDateChange(newDate);
        onClose();
    };
    
    const today = new Date();

    return (
        <div className="p-4 w-72">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-background-secondary text-content-secondary">&lt;</button>
                <div className="font-bold text-content-primary">{monthName} {year}</div>
                <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-background-secondary text-content-secondary">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-content-tertiary mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const isSelected = selectedDate ? (
                        selectedDate.getDate() === day &&
                        selectedDate.getMonth() === viewDate.getMonth() &&
                        selectedDate.getFullYear() === viewDate.getFullYear()
                    ) : false;
                    const isToday = today.getDate() === day && today.getMonth() === viewDate.getMonth() && today.getFullYear() === viewDate.getFullYear();
                    return (
                        <button key={day} onClick={() => handleDayClick(day)} className={`w-8 h-8 rounded-full text-sm hover:bg-background-secondary transition-colors ${isSelected ? 'bg-primary text-white' : ''} ${isToday && !isSelected ? 'border border-primary' : ''}`}>
                            {day}
                        </button>
                    );
                })}
            </div>
            <div className="flex justify-between mt-4">
                <button onClick={() => { onDateChange(new Date()); onClose(); }} className="px-4 py-1.5 text-sm rounded-md hover:bg-background-secondary">Today</button>
                <button onClick={() => { onDateChange(null); onClose(); }} className="px-4 py-1.5 text-sm rounded-md hover:bg-background-secondary">Clear</button>
            </div>
        </div>
    );
};