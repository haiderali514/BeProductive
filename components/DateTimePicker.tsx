import React, { useState, useMemo } from 'react';

interface DateTimePickerProps {
    value: Date;
    onChange: (date: Date) => void;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(value);
    const [time, setTime] = useState(value.toTimeString().substring(0, 5));

    const monthName = viewDate.toLocaleString('default', { month: 'long' });
    const year = viewDate.getFullYear();
    
    const daysInMonth = new Date(year, viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, viewDate.getMonth(), 1).getDay();

    const changeMonth = (offset: number) => {
        setViewDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };
    
    const handleDayClick = (day: number) => {
        const newDate = new Date(viewDate);
        newDate.setDate(day);
        setViewDate(newDate);
    };
    
    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTime(e.target.value);
    };

    const handleConfirm = () => {
        const [hours, minutes] = time.split(':').map(Number);
        const finalDate = new Date(viewDate);
        finalDate.setHours(hours, minutes, 0, 0);
        onChange(finalDate);
        setIsOpen(false);
    };

    const formattedValue = value.toLocaleString([], {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
    });

    return (
        <div className="relative">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full text-left bg-background-primary border border-border-primary rounded-md px-3 py-2">
                {formattedValue}
            </button>
            {isOpen && (
                <div className="absolute z-20 mt-1 w-72 bg-background-secondary rounded-lg shadow-xl border border-border-primary p-4">
                    <div className="flex justify-between items-center mb-2">
                        <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-border-primary text-content-secondary">&lt;</button>
                        <span className="font-semibold">{monthName} {year}</span>
                        <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-border-primary text-content-secondary">&gt;</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-content-tertiary">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 mt-1">
                         {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`}></div>)}
                         {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                             const isSelected = viewDate.getDate() === day;
                             return (
                                <button type="button" key={day} onClick={() => handleDayClick(day)} className={`w-8 h-8 rounded-full text-sm ${isSelected ? 'bg-primary text-white' : 'hover:bg-background-tertiary'}`}>
                                    {day}
                                </button>
                            );
                         })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border-primary">
                        <input type="time" value={time} onChange={handleTimeChange} className="w-full bg-background-primary border border-border-primary rounded-md px-3 py-2" />
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                        <button type="button" onClick={() => setIsOpen(false)} className="px-3 py-1 rounded-md text-sm bg-background-tertiary hover:bg-border-primary">Cancel</button>
                        <button type="button" onClick={handleConfirm} className="px-3 py-1 rounded-md text-sm bg-primary text-white hover:bg-primary-focus">OK</button>
                    </div>
                </div>
            )}
        </div>
    );
};
