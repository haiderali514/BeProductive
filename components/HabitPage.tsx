
import React, { useState, useMemo } from 'react';
import { Habit } from '../types';
import { HabitStatsPanel } from './HabitStatsPanel';
import { CreateHabitModal } from './CreateHabitModal';
import { Settings } from '../hooks/useSettings';

interface HabitPageProps {
  habits: Habit[];
  onToggleHabit: (habitId: string, date: string) => void;
  onAddHabit: (habitData: { name: string; icon: string; period: 'Morning' | 'Afternoon' | 'Night' }) => void;
  settings: Settings;
}

const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Helper to get a timezone-safe YYYY-MM-DD string from a Date object
const toYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const WeeklyCalendarHeader: React.FC<{ startWeekOn: Settings['startWeekOn'] }> = ({ startWeekOn }) => {
    const today = new Date();
    const startDayIndex = startWeekOn === 'monday' ? 1 : 0; // 0 for Sunday, 1 for Monday

    const dayHeaders = useMemo(() => {
        const headers = [...dayShortNames];
        if (startWeekOn === 'monday') {
            headers.push(headers.shift()!); // Move Sunday to the end
        }
        return headers;
    }, [startWeekOn]);
    
    // Calculate the day of the week, adjusted for the start day
    const currentDayOfWeek = today.getDay(); // 0 for Sunday
    const adjustedDayOfWeek = (currentDayOfWeek - startDayIndex + 7) % 7;

    const dates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - adjustedDayOfWeek + i);
        return d;
    });

    return (
        <div className="flex justify-between items-center mb-6">
            {dates.map((date, index) => (
                <div key={index} className="text-center w-12">
                    <p className="text-xs text-content-secondary">{dayHeaders[index]}</p>
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
    startWeekOn: Settings['startWeekOn'];
}> = ({ habit, onToggleHabit, onSelect, isSelected, startWeekOn }) => {
    // Display a rolling 7-day history ending today.
    const dates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i)); // 6-i results in a sequence from 6 days ago to today
        return toYYYYMMDD(d);
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

const ChevronIcon: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);


export const HabitPage: React.FC<HabitPageProps> = ({ habits, onToggleHabit, onAddHabit, settings }) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [collapsedPeriods, setCollapsedPeriods] = useState<Record<string, boolean>>({});

  const handleSelectHabit = (habitId: string) => {
    setSelectedHabitId(prevId => (prevId === habitId ? null : habitId));
  };
  
  const handleTogglePeriod = (period: string) => {
    setCollapsedPeriods(prev => ({
        ...prev,
        [period]: !prev[period],
    }));
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
        <WeeklyCalendarHeader startWeekOn={settings.startWeekOn} />

        <div className="space-y-8">
            {(['Morning', 'Afternoon', 'Night'] as const).map((period) => {
                const periodHabits = groupedHabits[period];
                if (!periodHabits || periodHabits.length === 0) return null;
                const isCollapsed = collapsedPeriods[period];
                return (
                    <div key={period}>
                        <button onClick={() => handleTogglePeriod(period)} className="w-full flex items-center text-lg font-semibold text-content-secondary mb-3 hover:text-content-primary transition-colors">
                           <ChevronIcon isCollapsed={!!isCollapsed} />
                           <span className="ml-2">{period}</span>
                           <span className="ml-2 text-sm font-normal text-content-tertiary">{periodHabits.length}</span>
                        </button>
                        {!isCollapsed && (
                            <div className="space-y-3 pl-7">
                                {periodHabits.map(habit => (
                                    <HabitItem
                                        key={habit.id}
                                        habit={habit}
                                        onToggleHabit={onToggleHabit}
                                        onSelect={handleSelectHabit}
                                        isSelected={selectedHabitId === habit.id}
                                        startWeekOn={settings.startWeekOn}
                                    />
                                ))}
                            </div>
                        )}
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
