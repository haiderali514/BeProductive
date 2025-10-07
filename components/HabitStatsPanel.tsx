import React, { useState, useMemo } from 'react';
import { Habit } from '../types.ts';

interface HabitStatsPanelProps {
    habits: Habit[];
    selectedHabit: Habit | null;
}

const SwitchIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M5 12a7 7 0 117 7" />
    </svg>
);

const SwitchableStatCard: React.FC<{
  title1: string; value1: string | number; description1?: string;
  title2: string; value2: string | number; description2?: string;
}> = ({ title1, value1, description1, title2, value2, description2 }) => {
  const [showFirst, setShowFirst] = useState(true);

  const StatContent: React.FC<{title: string, value: string|number, description?: string}> = ({title, value, description}) => (
    <>
      <p className="text-sm text-content-secondary pr-4 h-8">{title}</p>
      <p className="text-2xl font-bold text-content-primary truncate">{value}</p>
      <div className="h-4">
        {description && <p className="text-xs text-content-tertiary">{description}</p>}
      </div>
    </>
  );

  return (
    <div onClick={() => setShowFirst(!showFirst)} className="bg-background-tertiary p-4 rounded-lg cursor-pointer relative group transition-transform hover:scale-105 min-h-[110px]">
      <div className="absolute top-3 right-3 text-content-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
        <SwitchIcon />
      </div>
      {showFirst ? (
        <StatContent title={title1} value={value1} description={description1} />
      ) : (
        <StatContent title={title2} value={value2} description={description2} />
      )}
    </div>
  );
};


const toYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const calculateStreak = (checkIns: string[]): number => {
    if (checkIns.length === 0) return 0;
    
    const checkInSet = new Set(checkIns);
    
    let currentDate = new Date();
    if (!checkInSet.has(toYYYYMMDD(currentDate))) {
      currentDate.setDate(currentDate.getDate() - 1);
      if (!checkInSet.has(toYYYYMMDD(currentDate))) {
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

const calculateLongestStreak = (checkIns: string[]): number => {
    if (checkIns.length < 2) return checkIns.length;

    const sortedDates = checkIns.map(d => new Date(d).getTime()).sort((a, b) => a - b);
    
    const uniqueDates = [...new Set(sortedDates)];

    let longestStreak = 0;
    let currentStreak = 0;
    
    if (uniqueDates.length > 0) {
        longestStreak = 1;
        currentStreak = 1;
    }

    for (let i = 1; i < uniqueDates.length; i++) {
        const diff = uniqueDates[i] - uniqueDates[i-1];
        const oneDay = 1000 * 60 * 60 * 24;

        if (diff === oneDay) {
            currentStreak++;
        } else {
            currentStreak = 1;
        }
        
        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }
    }

    return longestStreak;
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
    const {
        monthlyCheckins,
        todaysCheckins,
        completionRate,
        highestCurrentStreak,
        totalCheckins,
        totalCompletionRate,
        monthlyRate,
        longestStreakEver
    } = useMemo(() => {
        const now = new Date();
        const todayStr = toYYYYMMDD(now);
        const todaysCheckins = habits.filter(h => h.checkIns.includes(todayStr)).length;
        const totalHabits = habits.length;
        const completionRate = totalHabits > 0 ? Math.round((todaysCheckins / totalHabits) * 100) : 0;
        
        const highestCurrentStreak = Math.max(0, ...habits.map(h => calculateStreak(h.checkIns)));
        
        const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthlyCheckins = habits.reduce((sum, h) => sum + h.checkIns.filter(ci => ci.startsWith(monthPrefix)).length, 0);

        const totalCheckins = habits.reduce((sum, h) => sum + h.checkIns.length, 0);
        const totalDaysSum = habits.reduce((sum, h) => sum + (h.totalDays || 1), 1);
        const totalCompletionRate = totalDaysSum > 0 ? Math.round((totalCheckins / totalDaysSum) * 100) : 0;
        
        const daysInMonthSoFar = now.getDate();
        const monthlyRate = (totalHabits * daysInMonthSoFar) > 0 ? Math.round((monthlyCheckins / (totalHabits * daysInMonthSoFar)) * 100) : 0;
        
        const longestStreakEver = Math.max(0, ...habits.map(h => calculateLongestStreak(h.checkIns)));

        return { monthlyCheckins, todaysCheckins, completionRate, highestCurrentStreak, totalCheckins, totalCompletionRate, monthlyRate, longestStreakEver };
    }, [habits]);

    return (
        <div>
            <h2 className="text-xl font-bold mb-6 text-content-primary">Overall Stats</h2>
            <div className="grid grid-cols-2 gap-4">
                <SwitchableStatCard 
                    title1="Today's Check-ins" value1={todaysCheckins}
                    title2="Total Check-ins" value2={totalCheckins} description2="All time"
                />
                <SwitchableStatCard 
                    title1="Today's Completion Rate" value1={`${completionRate}%`}
                    title2="Overall Completion Rate" value2={`${totalCompletionRate}%`} description2="All time"
                />
                <SwitchableStatCard
                    title1="Highest Current Streak" value1={highestCurrentStreak} description1="Across all habits"
                    title2="Longest Streak Ever" value2={longestStreakEver} description2="Across all habits"
                />
                <SwitchableStatCard
                    title1="Monthly Check-ins" value1={monthlyCheckins}
                    title2="Monthly Completion Rate" value2={`${monthlyRate}%`}
                />
            </div>
            <OverallActivityCalendar habits={habits} />
        </div>
    );
};

const SpecificHabitStats: React.FC<{ habit: Habit }> = ({ habit }) => {
    const {
        totalCheckins,
        currentStreak,
        monthlyCheckins,
        monthlyRate,
        todaysCheckin,
        overallCompletionRate,
        longestStreak
    } = useMemo(() => {
        const now = new Date();
        const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const monthlyCheckins = habit.checkIns.filter(d => d.startsWith(monthPrefix)).length;
        const daysInMonthSoFar = now.getDate();
        const monthlyRate = daysInMonthSoFar > 0 ? Math.round((monthlyCheckins / daysInMonthSoFar) * 100) : 0;
        
        const todayStr = toYYYYMMDD(now);
        const todaysCheckin = habit.checkIns.includes(todayStr);

        const overallCompletionRate = habit.totalDays > 0 ? Math.round((habit.checkIns.length / habit.totalDays) * 100) : 0;

        const longestStreak = calculateLongestStreak(habit.checkIns);
        
        return {
            totalCheckins: habit.checkIns.length,
            currentStreak: calculateStreak(habit.checkIns),
            monthlyCheckins,
            monthlyRate,
            todaysCheckin,
            overallCompletionRate,
            longestStreak
        };
    }, [habit]);

    return (
        <div>
            <div className="flex items-center mb-6">
                <span className="text-4xl mr-4">{habit.icon}</span>
                <h2 className="text-2xl font-bold text-content-primary truncate">{habit.name}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <SwitchableStatCard
                    title1="Today's Check-in" value1={todaysCheckin ? '✅ Completed' : '❌ Pending'}
                    title2="Total Check-ins" value2={totalCheckins} description2="All time"
                />
                 <SwitchableStatCard
                    title1="Monthly Check-ins" value1={monthlyCheckins}
                    title2="Monthly Completion Rate" value2={`${monthlyRate}%`}
                />
                <SwitchableStatCard
                    title1="Current Streak" value1={`${currentStreak} Day${currentStreak !== 1 ? 's' : ''}`}
                    title2="Longest Streak Ever" value2={`${longestStreak} Day${longestStreak !== 1 ? 's' : ''}`}
                />
                <SwitchableStatCard
                    title1="Today's Completion Rate" value1={todaysCheckin ? '100%' : '0%'}
                    title2="Overall Completion Rate" value2={`${overallCompletionRate}%`} description2="All time"
                />
            </div>
            <SpecificHabitCalendar habit={habit} />
        </div>
    );
};

export const HabitStatsPanel: React.FC<HabitStatsPanelProps> = ({ habits, selectedHabit }) => {
    return (
        <aside className="h-full bg-background-secondary p-6 overflow-y-auto hidden md:block w-full">
            {selectedHabit ? <SpecificHabitStats habit={selectedHabit} /> : <OverallStats habits={habits} />}
        </aside>
    );
};