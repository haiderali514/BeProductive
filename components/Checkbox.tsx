import React from 'react';
import { Priority } from '../types';

interface CheckboxProps {
  checked: boolean;
  onChange: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'round' | 'square';
  disabled?: boolean;
  priority?: Priority;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, size = 'md', variant = 'round', disabled = false, priority = Priority.NONE }) => {
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
    
    const checkmarkStrokeWidth = 3;
    
    const priorityClasses: Record<Priority, { unchecked: string; checked: string }> = {
      [Priority.HIGH]: { unchecked: 'border-red-500', checked: 'bg-red-500 border-red-500' },
      [Priority.MEDIUM]: { unchecked: 'border-yellow-500', checked: 'bg-yellow-500 border-yellow-500' },
      [Priority.LOW]: { unchecked: 'border-blue-500', checked: 'bg-blue-500 border-blue-500' },
      [Priority.NONE]: { unchecked: 'border-content-tertiary', checked: 'bg-primary border-primary' },
    };

    const classes = priorityClasses[priority] || priorityClasses[Priority.NONE];

    return (
        <div onClick={disabled ? undefined : onChange} className={`${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${sizeClasses[size]} border-2 ${shapeClass} flex items-center justify-center transition-all duration-200 flex-shrink-0 ${checked ? classes.checked : `${classes.unchecked} hover:border-primary`}`}>
            {checked && <svg xmlns="http://www.w3.org/2000/svg" className={`${checkmarkSizes[size]} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={checkmarkStrokeWidth} d="M5 13l4 4L19 7" /></svg>}
        </div>
    );
};