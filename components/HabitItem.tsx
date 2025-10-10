import React, { useMemo } from 'react';
import { Habit } from '../types';
import { BoltSolidIcon, FireSolidIcon } from './Icons';

interface HabitItemProps {
    habit: Habit;
    onToggleHabit: (habitId: string, date: string) => void;
    onSelect: (habitId: string) => void;
    isSelected: boolean;
    selectedDate: string | null;
    onDragStart: () => void;
    onDrop: () => void;
    onDragEnter: () => void;
    onDragEnd: () => void;
    isDropTarget: boolean;
}

const toYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const HabitItem: React.FC<HabitItemProps> = ({ habit, onToggleHabit, onSelect, isSelected, selectedDate, onDragStart, onDrop, onDragEnter, onDragEnd, isDropTarget }) => {
    // 7-day history ending today.
    const dates = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return toYYYYMMDD(d);
    }), []);
    
    const CheckButton: React.FC<{ date: string; size?: 'sm' | 'lg' }> = ({ date, size = 'sm' }) => {
        const isChecked = habit.checkIns.includes(date);
        const sizeClasses = size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';
        const iconSizeClasses = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';

        return (
             <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleHabit(habit.id, date);
                }}
                className={`${sizeClasses} rounded-full transition-colors flex items-center justify-center font-bold flex-shrink-0 ${isChecked ? 'bg-primary hover:bg-primary-focus' : 'bg-background-tertiary hover:bg-background-primary'}`}
                aria-label={`Check in for ${habit.name} on ${date}`}
            >
                {isChecked && <svg xmlns="http://www.w3.org/2000/svg" className={`${iconSizeClasses} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </button>
        );
    };

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDrop={onDrop}
            onDragEnter={onDragEnter}
            onDragEnd={onDragEnd}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => onSelect(habit.id)}
            className={`relative p-3 bg-background-secondary rounded-lg cursor-pointer transition-all flex items-center justify-between border-2 ${isSelected ? 'border-primary' : 'border-transparent'}`}
        >
            {isDropTarget && <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-full z-10" />}
            
            {/* Left Side: Info */}
            <div className="flex items-center space-x-3 min-w-0 flex-1">
                <span className="text-3xl bg-background-primary p-2 rounded-full flex-shrink-0">{habit.icon}</span>
                <div className="min-w-0">
                    <p className="text-content-primary font-semibold truncate">{habit.name}</p>
                    <div className="flex items-center space-x-3 text-xs text-content-secondary mt-1">
                        <span className="flex items-center"><BoltSolidIcon className="w-3.5 h-3.5 mr-1 text-blue-400" /> {habit.checkIns.length} Days</span>
                        <span className="flex items-center"><FireSolidIcon className="w-3.5 h-3.5 mr-1 text-red-400" /> {habit.streak} Day</span>
                    </div>
                </div>
            </div>

            {/* Right Side: Actions */}
            <div className="flex-shrink-0 pl-2">
                {selectedDate ? (
                    <CheckButton date={selectedDate} size="lg" />
                ) : (
                    <div className="hidden sm:flex items-center space-x-1.5">
                        {dates.map(date => <CheckButton key={date} date={date} size="sm" />)}
                    </div>
                )}
            </div>
        </div>
    );
};
