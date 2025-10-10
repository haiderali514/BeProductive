import React, { useState, useMemo } from 'react';
import { Habit } from '../types';
import { HabitStatsPanel } from './HabitStatsPanel';
import { CreateHabitModal } from './CreateHabitModal';
import { Settings } from '../hooks/useSettings';
import { ResizablePanel } from './ResizablePanel';
import { CircularProgress } from './CircularProgress';
import { LibraryIcon, MatrixIcon, PlusIcon, MoreIcon } from './Icons';
import useLocalStorage from '../hooks/useLocalStorage';
import { HabitItem } from './HabitItem';

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
        <div className="flex justify-around items-center gap-2">
            {dayCardsData.map(({ date, dateStr, progress }) => {
                const isSelected = selectedDate === dateStr;
                const isToday = toYYYYMMDD(today) === dateStr;
                const dayName = date.toLocaleString(undefined, { weekday: 'short' });

                return (
                    <div
                        key={dateStr}
                        onClick={() => onDateSelect(dateStr)}
                        className={`text-center p-2 rounded-lg cursor-pointer transition-all flex-1 ${isSelected ? 'bg-background-tertiary' : 'hover:bg-background-tertiary'}`}
                    >
                        <p className={`text-sm mb-2 ${isSelected ? 'text-primary' : 'text-content-secondary'}`}>{dayName}</p>
                        <p className={`font-semibold mb-3 text-lg ${isToday && !isSelected ? 'text-primary' : ''}`}>{date.getDate()}</p>
                        <div className="relative w-8 h-8 mx-auto">
                           <CircularProgress size={32} strokeWidth={3} progress={progress} />
                        </div>
                    </div>
                );
            })}
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
  const [collapsedPeriods, setCollapsedPeriods] = useLocalStorage<Record<string, boolean>>('habit_collapsed_periods', {});
  const [viewMode, setViewMode] = useLocalStorage<'list' | 'grid'>('habit-view-mode', 'list');
  
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

  const groupedHabits = useMemo(() => {
    return habits.reduce((acc, habit) => {
      const period = habit.period;
      if (!acc[period]) {
        acc[period] = [];
      }
      acc[period].push(habit);
      return acc;
    }, {} as Record<string, Habit[]>);
  }, [habits]);


  return (
    <>
      <ResizablePanel storageKey="habit-stats-width" panelSide="right" initialWidth={480} minWidth={320} maxWidth={600}>
        <HabitStatsPanel habits={habits} selectedHabit={selectedHabit} onToggleHabit={onToggleHabit} />
        <div className="flex flex-col h-full bg-background-primary">
            <div className="px-6 pt-6 pb-4 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-content-primary">Habit</h1>
                    <div className="flex items-center space-x-2">
                         <button
                            onClick={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')}
                            className="p-2 bg-background-secondary text-content-secondary rounded-lg hover:bg-background-tertiary hover:text-content-primary transition-colors"
                            aria-label={`Switch to ${viewMode === 'list' ? 'grid' : 'list'} view`}
                            title={`Switch to ${viewMode === 'list' ? 'grid' : 'list'} view`}
                        >
                            {viewMode === 'list' ? <MatrixIcon className="w-5 h-5" /> : <LibraryIcon className="w-5 h-5" />}
                        </button>
                        <button 
                            onClick={() => setCreateModalOpen(true)}
                            className="p-2 bg-background-secondary text-content-secondary rounded-lg hover:bg-background-tertiary hover:text-content-primary transition-colors"
                            aria-label="Create new habit"
                            title="Create new habit"
                        >
                            <PlusIcon />
                        </button>
                         <button 
                            className="p-2 bg-background-secondary text-content-secondary rounded-lg hover:bg-background-tertiary hover:text-content-primary transition-colors"
                            aria-label="More options"
                        >
                            <MoreIcon />
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="px-6 py-4 sticky top-0 bg-background-primary z-10 flex-shrink-0 border-b border-border-primary">
                <DailyProgressHeader 
                    habits={habits}
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-6">
                    {(['Morning', 'Afternoon', 'Night'] as const).map((period) => {
                        const periodHabits = groupedHabits[period];
                        if (!periodHabits || periodHabits.length === 0) return null;
                        const isCollapsed = collapsedPeriods[period];
                        return (
                            <div key={period}>
                                <button onClick={() => handleTogglePeriod(period)} className="w-full flex items-center text-sm font-semibold text-content-secondary mb-3 hover:text-content-primary transition-colors">
                                <ChevronIcon isCollapsed={!!isCollapsed} />
                                <span className="ml-2">{period}</span>
                                <span className="ml-2 text-sm font-normal text-content-tertiary">{periodHabits.length}</span>
                                </button>
                                {!isCollapsed && (
                                    <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 xl:grid-cols-2 gap-3' : 'space-y-3'}`}>
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
