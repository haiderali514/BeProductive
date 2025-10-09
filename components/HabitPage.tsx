import React, { useState, useMemo } from 'react';
import { Habit } from '../types';
import { HabitStatsPanel } from './HabitStatsPanel';
import { CreateHabitModal } from './CreateHabitModal';
import { Settings } from '../hooks/useSettings';
import { ResizablePanel } from './ResizablePanel';
import { CircularProgress } from './CircularProgress';

interface HabitPageProps {
  habits: Habit[];
  onToggleHabit: (habitId: string, date: string) => void;
  onAddHabit: (habitData: { name: string; icon: string; period: 'Morning' | 'Afternoon' | 'Night' }) => void;
  settings: Settings;
  onReorderHabit: (draggedId: string, targetId: string) => void;
}

// Helper to get a timezone-safe YYYY-MM-DD string from a Date object
const toYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const DailyProgressHeader: React.FC<{
    habits: Habit[];
    selectedDate: string | null;
    onDateSelect: (date: string) => void;
}> = ({ habits, selectedDate, onDateSelect }) => {
    const today = useMemo(() => new Date(), []);
    
    const dayCardsData = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (6 - i));
            const dateStr = toYYYYMMDD(d);
            
            const checkInsOnThisDay = habits.filter(h => h.checkIns.includes(dateStr)).length;
            const progress = habits.length > 0 ? Math.round((checkInsOnThisDay / habits.length) * 100) : 0;
            
            return { date: d, dateStr, progress };
        });
    }, [today, habits]);

    return (
        <div className="flex justify-between items-center mb-4">
            {dayCardsData.map(({ date, dateStr, progress }) => {
                const isSelected = selectedDate === dateStr;
                const isToday = toYYYYMMDD(today) === dateStr;
                const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });

                return (
                    <div
                        key={dateStr}
                        onClick={() => onDateSelect(dateStr)}
                        className={`text-center p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/20' : 'hover:bg-background-tertiary'}`}
                    >
                        <p className={`text-sm mb-2 ${isSelected ? 'text-primary' : 'text-content-secondary'}`}>{dayName}</p>
                        <p className={`font-semibold mb-3 ${isToday && !isSelected ? 'text-primary' : ''}`}>{date.getDate()}</p>
                        <div className="relative w-10 h-10 mx-auto">
                            {progress === 100 ? (
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            ) : (
                                <CircularProgress size={40} strokeWidth={4} progress={progress} />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


const HabitItem: React.FC<{
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
}> = ({ habit, onToggleHabit, onSelect, isSelected, selectedDate, onDragStart, onDrop, onDragEnter, onDragEnd, isDropTarget }) => {
    // Display a rolling 8-day history ending today.
    const dates = useMemo(() => Array.from({ length: 8 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (7 - i)); // 7-i results in a sequence from 7 days ago to today
        return toYYYYMMDD(d);
    }), []);
    
    const CheckButton: React.FC<{ date: string }> = ({ date }) => {
        const isChecked = habit.checkIns.includes(date);
        return (
             <button 
                key={date}
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleHabit(habit.id, date);
                }}
                className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center font-bold ${isChecked ? 'bg-primary hover:bg-primary-focus' : 'bg-background-tertiary hover:bg-background-primary'}`}
                aria-label={`Check in for ${habit.name} on ${date}`}
            >
                {isChecked && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
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
            className={`relative flex items-center p-4 bg-background-secondary rounded-lg cursor-pointer transition-all border-l-4 ${isSelected ? 'bg-primary/10 border-primary' : 'border-transparent'}`}
        >
            {isDropTarget && <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-full z-10" />}
            <div className="flex items-center w-2/5">
                <span className="text-2xl mr-4">{habit.icon}</span>
                <div>
                    <p className="text-content-primary font-medium">{habit.name}</p>
                    <p className="text-xs text-content-secondary">{habit.totalDays} Days · 🔥 {habit.streak} Day</p>
                </div>
            </div>
            <div className={`flex-1 flex items-center ${selectedDate ? 'justify-end' : 'justify-between'}`}>
                {selectedDate ? (
                    <CheckButton date={selectedDate} />
                ) : (
                    dates.map(date => <CheckButton key={date} date={date} />)
                )}
            </div>
        </div>
    );
};

const ChevronIcon: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);


export const HabitPage: React.FC<HabitPageProps> = ({ habits, onToggleHabit, onAddHabit, settings, onReorderHabit }) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [collapsedPeriods, setCollapsedPeriods] = useState<Record<string, boolean>>({});
  
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  
  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(prev => prev === dateStr ? null : dateStr);
  };

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragEnter = (id: string) => { if (id !== draggedId) setDropTargetId(id); };
  const handleDrop = () => {
    if (draggedId && dropTargetId) {
        const draggedHabit = habits.find(h => h.id === draggedId);
        const targetHabit = habits.find(h => h.id === dropTargetId);
        if (draggedHabit && targetHabit && draggedHabit.period === targetHabit.period) {
            onReorderHabit(draggedId, dropTargetId);
        }
    }
    setDraggedId(null);
    setDropTargetId(null);
  };
  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTargetId(null);
  };

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
    <>
      <ResizablePanel storageKey="habit-stats-width" panelSide="right" initialWidth={480} minWidth={320} maxWidth={600}>
        <HabitStatsPanel habits={habits} selectedHabit={selectedHabit} onToggleHabit={onToggleHabit} />
        <div className="p-6 overflow-y-auto h-full">
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
            
            <DailyProgressHeader 
                habits={habits}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
            />

            <div className="space-y-6">
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
                                            selectedDate={selectedDate}
                                            onDragStart={() => handleDragStart(habit.id)}
                                            onDrop={handleDrop}
                                            onDragEnter={() => handleDragEnter(habit.id)}
                                            onDragEnd={handleDragEnd}
                                            isDropTarget={dropTargetId === habit.id}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      </ResizablePanel>
      {isCreateModalOpen && (
        <CreateHabitModal
            isOpen={isCreateModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onAddHabit={onAddHabit}
        />
      )}
    </>
  );
};