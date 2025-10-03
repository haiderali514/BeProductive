import React, { useState, useMemo } from 'react';
import { Habit } from '../types';

interface HabitStatsPanelProps {
    habits: Habit[];
    selectedHabit: Habit | null;
}

const StatCard: React.FC<{ title: string; value: string | number; description?: string }> = ({ title, value, description }) => (
    <div className="bg-background-tertiary p-4 rounded-lg">
        <p className="text-sm text-content-secondary">{title}</p>
        <p className="text-2xl font-bold text-content-primary">{value}</p>
        {description && <p className="text-xs text-content-tertiary">{description}</p>}
    </div>
);

const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0];

const calculateStreak = (checkIns: string[]): number => {
    if (checkIns.length === 0) return 0;
    
    const checkInSet = new Set(checkIns);
    
    // Streak calculation should start from today or yesterday.
    let currentDate = new Date();
    if (!checkInSet.has(toYYYYMMDD(currentDate))) {
      currentDate.setDate(currentDate.getDate() - 1);
      // If yesterday is also not checked, streak is 0, unless today is the only check-in.
      if (!checkInSet.has(toYYYYMMDD(currentDate)) && !(checkInSet.size === 1 && checkInSet.has(toYYYYMMDD(new Date())))) {
        return 0;
      }
    }
    
    let streak = 0;
    while(checkInSet.has(toYYYYMMDD(currentDate))) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
};


const SpecificHabitCalendar: React.FC<{ habit: Habit }> = ({ habit }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    
    const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, currentDate.getMonth(), 1).getDay(); // 0 = Sunday
    
    const checkInsSet = useMemo(() => new Set(habit.checkIns), [habit.checkIns]);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };
    
    return (
        <div className="mt-8">
            <h3 className="text-lg font-semibold text-content-primary mb-4">Check-in Calendar</h3>
            <div className="bg-background-tertiary p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-border-primary">&lt;</button>
                    <h4 className="font-bold">{monthName} {year}</h4>
                    <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-border-primary">&gt;</button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs text-content-secondary">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2 mt-2">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const dateStr = toYYYYMMDD(new Date(year, currentDate.getMonth(), day));
                        const isChecked = checkInsSet.has(dateStr);
                        const isToday = dateStr === toYYYYMMDD(new Date());
                        return (
                             <div key={day} className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${isToday ? 'border-2 border-primary' : ''} ${isChecked ? 'bg-primary text-white' : ''}`}>
                                {day}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    )
};


const OverallActivityCalendar: React.FC<{ habits: Habit[] }> = ({ habits }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    
    const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, currentDate.getMonth(), 1).getDay(); // 0 = Sunday
    
    const checkInsByDate = useMemo(() => {
        const counts: Record<string, number> = {};
        habits.forEach(habit => {
            habit.checkIns.forEach(dateStr => {
                counts[dateStr] = (counts[dateStr] || 0) + 1;
            });
        });
        return counts;
    }, [habits]);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };
    
    const getBgColorForCount = (count: number): string => {
        if (count === 0) return '';
        if (count === 1) return 'bg-primary/30';
        if (count <= 3) return 'bg-primary/60';
        return 'bg-primary'; // for more than 3
    };

    return (
        <div className="mt-8">
            <h3 className="text-lg font-semibold text-content-primary mb-4">Overall Activity</h3>
            <div className="bg-background-tertiary p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-border-primary">&lt;</button>
                    <h4 className="font-bold">{monthName} {year}</h4>
                    <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-border-primary">&gt;</button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs text-content-secondary">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2 mt-2">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const dateStr = toYYYYMMDD(new Date(year, currentDate.getMonth(), day));
                        const checkInCount = checkInsByDate[dateStr] || 0;
                        const bgColor = getBgColorForCount(checkInCount);
                        const isToday = dateStr === toYYYYMMDD(new Date());
                        
                        return (
                             <div 
                                key={day} 
                                title={checkInCount > 0 ? `${checkInCount} habit${checkInCount > 1 ? 's' : ''} completed` : undefined}
                                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors ${isToday ? 'border-2 border-primary' : ''} ${bgColor}`}
                             >
                                {day}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


const OverallStats: React.FC<{ habits: Habit[] }> = ({ habits }) => {
    const { totalHabits, todaysCheckins, completionRate, longestStreak } = useMemo(() => {
        const todayStr = toYYYYMMDD(new Date());
        const todaysCheckins = habits.filter(h => h.checkIns.includes(todayStr)).length;
        const totalHabits = habits.length;
        const completionRate = totalHabits > 0 ? Math.round((todaysCheckins / totalHabits) * 100) : 0;
        const longestStreak = Math.max(0, ...habits.map(h => calculateStreak(h.checkIns)));
        
        return { totalHabits, todaysCheckins, completionRate, longestStreak };
    }, [habits]);

    return (
        <div>
            <h2 className="text-xl font-bold mb-6 text-content-primary">Overall Stats</h2>
            <div className="grid grid-cols-2 gap-4">
                <StatCard title="Total Habits" value={totalHabits} />
                <StatCard title="Today's Check-ins" value={todaysCheckins} />
                <StatCard title="Completion Rate" value={`${completionRate}%`} description="For today" />
                <StatCard title="Longest Streak" value={longestStreak} description="Across all habits" />
            </div>
            <OverallActivityCalendar habits={habits} />
        </div>
    );
};

const SpecificHabitStats: React.FC<{ habit: Habit }> = ({ habit }) => {
    const { totalCheckins, currentStreak, monthlyCheckins, monthlyRate } = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
        
        const monthlyCheckins = habit.checkIns.filter(d => d.startsWith(monthPrefix)).length;
        const daysInMonthSoFar = now.getDate();
        const monthlyRate = Math.round((monthlyCheckins / daysInMonthSoFar) * 100);
        
        return {
            totalCheckins: habit.checkIns.length,
            currentStreak: calculateStreak(habit.checkIns),
            monthlyCheckins,
            monthlyRate
        };
    }, [habit]);

    return (
        <div>
            <div className="flex items-center mb-6">
                <span className="text-4xl mr-4">{habit.icon}</span>
                <h2 className="text-2xl font-bold text-content-primary truncate">{habit.name}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <StatCard title="Monthly check-ins" value={monthlyCheckins} />
                <StatCard title="Total check-ins" value={totalCheckins} />
                <StatCard title="Monthly check-in rate" value={`${monthlyRate}%`} />
                <StatCard title="Streak" value={`${currentStreak} Day${currentStreak !== 1 ? 's' : ''}`} />
            </div>
            <SpecificHabitCalendar habit={habit} />
        </div>
    );
};

export const HabitStatsPanel: React.FC<HabitStatsPanelProps> = ({ habits, selectedHabit }) => {
    return (
        <aside className="w-[400px] bg-background-secondary border-l border-border-primary p-6 overflow-y-auto hidden md:block">
            {selectedHabit ? <SpecificHabitStats habit={selectedHabit} /> : <OverallStats habits={habits} />}
        </aside>
    );
};