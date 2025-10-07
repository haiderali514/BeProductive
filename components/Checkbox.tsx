import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'round' | 'square';
  disabled?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, size = 'md', variant = 'round', disabled = false }) => {
    const sizeClasses = {
        sm: 'w-4 h-4', // for subtasks
        md: 'w-5 h-5', // for task items
        lg: 'w-6 h-6', // for detail panel header
    };
    const checkmarkSizes = {
        sm: 'h-2.5 w-2.5',
        md: 'h-3 w-3',
        lg: 'h-4 w-4',
    };

    const shapeClass = variant === 'round' ? 'rounded-full' : 'rounded-md';
    
    // Using strokeWidth 3 for all sizes gives a consistent bold checkmark
    const checkmarkStrokeWidth = 3;

    return (
        <div onClick={disabled ? undefined : onChange} className={`${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${sizeClasses[size]} border-2 ${shapeClass} flex items-center justify-center transition-all duration-200 flex-shrink-0 ${checked ? 'bg-primary border-primary' : 'border-content-tertiary hover:border-primary'}`}>
            {checked && <svg xmlns="http://www.w3.org/2000/svg" className={`${checkmarkSizes[size]} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={checkmarkStrokeWidth} d="M5 13l4 4L19 7" /></svg>}
        </div>
    );
};