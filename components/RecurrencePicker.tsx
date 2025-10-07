
import React from 'react';
import { Recurrence } from '../types.ts';

interface RecurrencePickerProps {
    onSetRecurrence: (recurrence: Recurrence | null) => void;
    onClose: () => void;
}

const recurrenceOptions = [
    { value: null, label: 'No Recurrence' },
    { value: Recurrence.DAILY, label: 'Daily' },
    { value: Recurrence.WEEKLY, label: 'Weekly' },
    { value: Recurrence.MONTHLY, label: 'Monthly' },
    { value: Recurrence.YEARLY, label: 'Yearly' },
];

export const RecurrencePicker: React.FC<RecurrencePickerProps> = ({ onSetRecurrence, onClose }) => {
    
    const handleSelect = (recurrence: Recurrence | null) => {
        onSetRecurrence(recurrence);
        onClose();
    };
    
    return (
        <div className="absolute z-10 right-0 mt-2 w-48 bg-background-tertiary rounded-md shadow-lg border border-border-primary">
            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                {recurrenceOptions.map(option => (
                     <button
                        key={option.label}
                        onClick={() => handleSelect(option.value)}
                        className="block w-full text-left px-4 py-2 text-sm text-content-primary hover:bg-primary hover:text-primary-content transition-colors duration-150"
                        role="menuitem"
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
};