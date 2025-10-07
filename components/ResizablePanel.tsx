import React, { useCallback, useRef } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

interface ResizablePanelProps {
  children: [React.ReactNode, React.ReactNode];
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey: string;
  panelSide?: 'left' | 'right';
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  initialWidth = 250,
  minWidth = 200,
  maxWidth = 500,
  storageKey,
  panelSide = 'left',
}) => {
  const [panelWidth, setPanelWidth] = useLocalStorage(storageKey, initialWidth);
  const isResizing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    let newWidth;

    if (panelSide === 'left') {
        newWidth = e.clientX - rect.left;
    } else {
        newWidth = rect.right - e.clientX;
    }
    
    // Clamp the width between min and max
    if (newWidth < minWidth) newWidth = minWidth;
    if (newWidth > maxWidth) newWidth = maxWidth;

    setPanelWidth(newWidth);
  }, [minWidth, maxWidth, setPanelWidth, panelSide]);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const panelStyle = { width: `${panelWidth}px` };

  return (
    <div ref={containerRef} className={`flex h-full w-full ${panelSide === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
      <div style={panelStyle} className="flex-shrink-0">
        {/* We expect the child to handle its own scrolling and layout */}
        {children[0]}
      </div>
      <div
        onMouseDown={handleMouseDown}
        className="flex-shrink-0 w-1 cursor-col-resize bg-border-primary/50 hover:bg-primary transition-colors duration-200"
      />
      <div className="flex-1 min-w-0 flex flex-col">
        {children[1]}
      </div>
    </div>
  );
};
