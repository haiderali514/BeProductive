import React, { useState, useMemo } from 'react';
import { Habit } from '../types';
import { ArrowsRightLeftIcon, CheckCircleSolidIcon, BoltSolidIcon, FireSolidIcon, ChartPieSolidIcon } from './Icons';

interface HabitStatsPanelProps {
    habits: Habit[];
    selectedHabit: Habit | null;
    onToggleHabit: (habitId: string, date: string) => void;
}

const SwitchableStatCard: React.FC<{
  icon: React.ReactNode;
  title1: string; value1: string | number; description1?: string;
  title2: string; value2: string | number; description2?: string;
}> = ({ icon, title1, value1, description1, title2, value2, description2 }) => {
  const [showFirst, setShowFirst] = useState(true);

  const StatContent: React.FC<{title: string, value: string|number, description?: string}> = ({title, value, description}) => {
      const valueParts = typeof value === 'string' ? String(value).match(/^([\d,.]+)\s*(.*)$/) : null;
      return (
        <>
          <div className="flex items-center mb-1 cursor-pointer">
              <div className="w-4 h-4">{icon}</div>
              <p className="leading-4 text-xs text-content-secondary ml-1 truncate">{title}</p>
          </div>
          {valueParts ? (
                <div className="flex items-baseline">
                    <p className="text-xl font-semibold text-content-primary truncate leading-6">{valueParts[1]}</p>
                    {valueParts[2] && <p className="ml-1 text-xs font-medium text-content-secondary leading-5">{valueParts[2]}</p>}
                </div>
            ) : (
                <div className="text-xl font-semibold text-content-primary truncate leading-6">{value}</div>
            )}
            {description && <p className="text-xs text-content-tertiary">{description}</p>}
        </>
      );
  };

  return (
    <div onClick={() => setShowFirst(!showFirst)} className="bg-background-secondary rounded-[12px] px-[14px] pt-[13px] pb-[11px] cursor-pointer relative group">
      <div className="absolute top-3 right-3 text-content-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowsRightLeftIcon className="w-4 h-4" />
      </div>
      {showFirst ? (
        <StatContent title={title1} value={value1} description={description1} />
      ) : (
        <StatContent title={title2} value={value2} description={description2} />
      )}
    </div>
  );
};

const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: React.ReactNode;
    description?: string;
}> = ({ icon, title, value, description }) => {
    const valueParts = typeof value === 'string' ? String(value).match(/^([\d,.]+)\s*(.*)$/) : null;

    return (
        <div className="bg-background-secondary rounded-[12px] px-[14px] pt-[13px] pb-[11px]">
            <div className="flex items-center mb-1">
                <div className="w-4 h-4">{icon}</div>
                <p className="text-xs text-content-secondary ml-1 truncate">{title}</p>
            </div>
            
            {valueParts ? (
                <div className="flex items-baseline">
                    <p className="text-xl font-semibold text-content-primary truncate leading-6">{valueParts[1]}</p>
                    {valueParts[2] && <p className="ml-1 text-xs font-medium text-content-secondary leading-5">{valueParts[2]}</p>}
                </div>
            ) : (
                <div className="text-xl font-semibold text-content-primary truncate leading-6">{value}</div>
            )}
            
            {description && <p className="text-xs text-content-tertiary">{description}</p>}
        </div>
    );
};


const toYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const calculateLongestStreak = (checkIns: string[]): number => {
    if (checkIns.length < 2) return checkIns.length;

    const sortedDates = [...new Set(checkIns)].sort();
    
    let longestStreak = 0;
    let currentStreak = 0;
    
    if (sortedDates.length > 0) {
        longestStreak = 1;
        currentStreak = 1;
    }

    for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]);
        const prevDate = new Date(sortedDates[i-1]);
        
        const diff = currentDate.getTime() - prevDate.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        
        if (Math.abs(diff - oneDay) < 1000) { // Allow tolerance for DST changes
            currentStreak++;
        } else {
            currentStreak = 1;
        }
        longestStreak = Math.max(longestStreak, currentStreak);
    }
    return longestStreak;
};


const SpecificHabitCalendar: React.FC<{
    habit: Habit;
    onToggleHabit: (habitId: string, date: string) => void;
}> = ({ habit, onToggleHabit }) => {
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
        <div className="mt-6">
            <div className="bg-background-secondary p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-border-primary">&lt;</button>
                    <div className="font-bold">{monthName} {year}</div>
                    <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-border-primary">&gt;</button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs text-content-secondary">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2 mt-2">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const dayDate = new Date(year, currentDate.getMonth(), day);
                        dayDate.setHours(0, 0, 0, 0);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const dateStr = toYYYYMMDD(dayDate);
                        const isChecked = checkInsSet.has(dateStr);
                        const isToday = dayDate.getTime() === today.getTime();
                        const isFuture = dayDate > today;
                        return (
                             <button 
                                key={day} 
                                disabled={isFuture}
                                onClick={() => !isFuture && onToggleHabit(habit.id, dateStr)}
                                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors ${isToday ? 'border-2 border-primary' : ''} ${isChecked ? 'bg-primary text-white' : 'hover:bg-background-primary'} ${isFuture ? 'text-content-tertiary cursor-not-allowed' : 'text-content-primary'}`}
                            >
                                {day}
                            </button>
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
        <div className="mt-6">
            <div className="bg-background-secondary p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-border-primary">&lt;</button>
                    <div className="font-bold">{monthName} {year}</div>
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
                                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors ${isToday ? 'border-2 border-primary' : ''} ${bgColor} hover:bg-background-primary`}
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


const OverallStatsContent: React.FC<{ habits: Habit[] }> = ({ habits }) => {
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
        
        const highestCurrentStreak = Math.max(0, ...habits.map(h => h.streak));
        
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
            <div className="grid grid-cols-2 gap-4">
                <SwitchableStatCard 
                    icon={<CheckCircleSolidIcon className="text-green-500" />}
                    title1="Monthly check-ins" value1={`${monthlyCheckins} Days`}
                    title2="Today's Check-ins" value2={todaysCheckins}
                />
                <SwitchableStatCard 
                    icon={<BoltSolidIcon className="text-blue-500" />}
                    title1="Total Check-Ins" value1={`${totalCheckins} Days`}
                    title2="Overall Rate" value2={`${totalCompletionRate}%`}
                />
                 <SwitchableStatCard
                    icon={<ChartPieSolidIcon className="text-orange-400" />}
                    title1="Monthly check-in rate" value1={`${monthlyRate}%`}
                    title2="Today's Rate" value2={`${completionRate}%`}
                />
                <SwitchableStatCard
                    icon={<FireSolidIcon className="text-red-500" />}
                    title1="Current Streak" value1={`${highestCurrentStreak} Days`}
                    title2="Longest Streak" value2={`${longestStreakEver} Days`}
                />
            </div>
            <OverallActivityCalendar habits={habits} />
        </div>
    );
};

const SpecificHabitStatsContent: React.FC<{
    habit: Habit;
    onToggleHabit: (habitId: string, date: string) => void;
}> = ({ habit, onToggleHabit }) => {
    const {
        totalCheckins,
        monthlyCheckins,
        monthlyRate,
        overallCompletionRate,
        longestStreak,
        nextMilestone,
    } = useMemo(() => {
        const now = new Date();
        const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const monthlyCheckins = habit.checkIns.filter(d => d.startsWith(monthPrefix)).length;
        const daysInMonthSoFar = now.getDate();
        const monthlyRate = daysInMonthSoFar > 0 ? Math.round((monthlyCheckins / daysInMonthSoFar) * 100) : 0;
        
        const overallCompletionRate = habit.totalDays > 0 ? Math.round((habit.checkIns.length / habit.totalDays) * 100) : 0;

        const longestStreak = calculateLongestStreak(habit.checkIns);

        const milestones = [21, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 365];
        const nextMilestone = milestones.find(day => day > habit.streak) || 365;
        
        return {
            totalCheckins: habit.checkIns.length,
            monthlyCheckins,
            monthlyRate,
            overallCompletionRate,
            longestStreak,
            nextMilestone,
        };
    }, [habit]);

    return (
        <div>
            <div className="grid grid-cols-2 gap-4">
                <SwitchableStatCard
                    icon={<BoltSolidIcon className="text-blue-500" />}
                    title1="Total Check-ins" value1={`${totalCheckins} Days`}
                    title2="Monthly check-ins" value2={`${monthlyCheckins} Days`}
                />
                 <SwitchableStatCard
                    icon={<ChartPieSolidIcon className="text-orange-400" />}
                    title1="Monthly check-in rate" value1={`${monthlyRate}%`}
                    title2="Overall Rate" value2={`${overallCompletionRate}%`}
                />
                <SwitchableStatCard
                    icon={<FireSolidIcon className="text-red-500" />}
                    title1="Current Streak" value1={`${habit.streak} Days`}
                    title2="Best Streak" value2={`${longestStreak} Days`}
                />
                <StatCard
                    icon={<CheckCircleSolidIcon className="text-green-500" />}
                    title="Next Milestone"
                    value={
                        <span className="text-xl font-semibold text-content-primary truncate leading-6">
                            {habit.streak} / <span className="text-content-secondary text-base">{nextMilestone} Days</span>
                        </span>
                    }
                />
            </div>
            <SpecificHabitCalendar habit={habit} onToggleHabit={onToggleHabit} />
        </div>
    );
};

export const HabitStatsPanel: React.FC<HabitStatsPanelProps> = ({ habits, selectedHabit, onToggleHabit }) => {
    return (
        <aside className="h-full bg-background-primary flex flex-col">
            {/* Sticky Header */}
            <div className="p-4 border-b border-border-primary flex-shrink-0 h-20 flex items-center">
                {selectedHabit ? (
                    <div className="flex items-center">
                        <span className="text-4xl mr-4">{selectedHabit.icon}</span>
                        <h2 className="text-2xl font-bold text-content-primary truncate">{selectedHabit.name}</h2>
                    </div>
                ) : (
                    <h2 className="text-2xl font-bold text-content-primary">Overall Stats</h2>
                )}
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 pt-4">
                {selectedHabit 
                    ? <SpecificHabitStatsContent habit={selectedHabit} onToggleHabit={onToggleHabit} /> 
                    : <OverallStatsContent habits={habits} />}
            </div>
        </aside>
    );
};