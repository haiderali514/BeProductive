import React, { useState, useMemo } from 'react';
import { Habit } from '../types';
import { HabitStatsPanel } from './HabitStatsPanel';
import { CreateHabitModal } from './CreateHabitModal';

interface HabitPageProps {
  habits: Habit[];
  onToggleHabit: (habitId: string, date: string) => void;
  onAddHabit: (habitData: { name: string; icon: string; period: 'Morning' | 'Afternoon' | 'Night' }) => void;
}

const dayShortNames = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const WeeklyCalendarHeader: React.FC = () => {
    const today = new Date();
    const dates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        const dayOfWeek = today.getDay(); // Sunday is 0, Saturday is 6
        const dateOffset = i - ((dayOfWeek + 1) % 7); // Adjust so Saturday is the first day (index 0)
        d.setDate(today.getDate() + dateOffset);
        return d;
    });

    return (
        <div className="flex justify-between items-center mb-6">
            {dates.map((date, index) => (
                <div key={index} className="text-center w-12">
                    <p className="text-xs text-content-secondary">{dayShortNames[index]}</p>
                    <div className={`mt-2 w-8 h-8 flex items-center justify-center rounded-full mx-auto ${date.toDateString() === today.toDateString() ? 'bg-primary text-white font-bold' : ''}`}>
                        {date.getDate()}
                    </div>
                </div>
            ))}
        </div>
    );
};

const HabitItem: React.FC<{
    habit: Habit;
    onToggleHabit: (habitId: string, date: string) => void;
    onSelect: (habitId: string) => void;
    isSelected: boolean;
}> = ({ habit, onToggleHabit, onSelect, isSelected }) => {
    const today = new Date();
    const dates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        const dayOfWeek = today.getDay();
        const dateOffset = i - ((dayOfWeek + 1) % 7);
        d.setDate(today.getDate() + dateOffset);
        return d.toISOString().split('T')[0];
    });

    return (
        <div
            onClick={() => onSelect(habit.id)}
            className={`flex items-center p-4 bg-background-secondary rounded-lg cursor-pointer transition-all border-l-4 ${isSelected ? 'bg-background-tertiary border-primary' : 'border-transparent hover:bg-background-tertiary/80'}`}
        >
            <div className="flex items-center w-2/5">
                <span className="text-2xl mr-4">{habit.icon}</span>
                <div>
                    <p className="text-content-primary font-medium">{habit.name}</p>
                    <p className="text-xs text-content-secondary">{habit.totalDays} Days · 🔥 {habit.streak} Day</p>
                </div>
            </div>
            <div className="flex-1 flex justify-between items-center">
                 {dates.map(date => {
                    const isChecked = habit.checkIns.includes(date);
                    return (
                        <button 
                            key={date}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleHabit(habit.id, date);
                            }}
                            className={`w-8 h-8 rounded-full transition-colors ${isChecked ? 'bg-primary' : 'bg-background-tertiary hover:bg-primary/50'}`}
                            aria-label={`Check in for ${habit.name} on ${date}`}
                        >
                            {isChecked && '✔'}
                        </button>
                    )
                 })}
            </div>
        </div>
    );
};

export const HabitPage: React.FC<HabitPageProps> = ({ habits, onToggleHabit, onAddHabit }) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const handleSelectHabit = (habitId: string) => {
    setSelectedHabitId(prevId => (prevId === habitId ? null : habitId));
  };

  const selectedHabit = useMemo(() => {
    if (!selectedHabitId) return null;
    return habits.find(h => h.id === selectedHabitId) || null;
  }, [selectedHabitId, habits]);

  const groupedHabits = habits.reduce((acc, habit) => {
    const period = habit.period;
    if (!acc[period]) {
      acc[period] = [];
    }
    acc[period].push(habit);
    return acc;
  }, {} as Record<string, Habit[]>);

  return (
    <div className="flex flex-1 h-full">
      <div className="p-8 flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-content-primary">Habit</h1>
            <button 
                onClick={() => setCreateModalOpen(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-focus transition-colors flex items-center space-x-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <span>Create Habit</span>
            </button>
        </div>
        <WeeklyCalendarHeader />

        <div className="space-y-8">
            {(['Morning', 'Afternoon', 'Night'] as const).map((period) => {
                const periodHabits = groupedHabits[period];
                if (!periodHabits || periodHabits.length === 0) return null;
                return (
                    <div key={period}>
                        <h2 className="text-lg font-semibold text-content-secondary mb-3">{period} <span className="text-sm font-normal text-content-tertiary">{periodHabits.length}</span></h2>
                        <div className="space-y-3">
                            {periodHabits.map(habit => (
                                <HabitItem
                                    key={habit.id}
                                    habit={habit}
                                    onToggleHabit={onToggleHabit}
                                    onSelect={handleSelectHabit}
                                    isSelected={selectedHabitId === habit.id}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
      <HabitStatsPanel habits={habits} selectedHabit={selectedHabit} />
      {isCreateModalOpen && (
        <CreateHabitModal
            isOpen={isCreateModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onAddHabit={onAddHabit}
        />
      )}
    </div>
  );
};