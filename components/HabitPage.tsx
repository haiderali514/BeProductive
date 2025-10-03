
import React from 'react';
import { Habit } from '../types';

interface HabitPageProps {
  habits: Habit[];
  onToggleHabit: (habitId: string, date: string) => void;
}

const dayShortNames = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const WeeklyCalendarHeader: React.FC = () => {
    const today = new Date();
    const dates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (today.getDay() - i + 7) % 7); // Adjust to start week on Saturday
        return d;
    });

    return (
        <div className="flex justify-between items-center mb-6">
            {dates.map((date, index) => (
                <div key={index} className="text-center w-12">
                    <p className="text-xs text-content-secondary">{dayShortNames[(date.getDay() + 1) % 7]}</p>
                    <div className={`mt-2 w-8 h-8 flex items-center justify-center rounded-full mx-auto ${date.toDateString() === today.toDateString() ? 'bg-primary text-white font-bold' : ''}`}>
                        {date.getDate()}
                    </div>
                </div>
            ))}
        </div>
    );
};

const HabitItem: React.FC<{ habit: Habit; onToggleHabit: (habitId: string, date: string) => void }> = ({ habit, onToggleHabit }) => {
    const today = new Date();
    const dates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (today.getDay() - i + 7) % 7);
        return d.toISOString().split('T')[0];
    });

    return (
        <div className="flex items-center p-4 bg-background-secondary rounded-lg">
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
                            onClick={() => onToggleHabit(habit.id, date)}
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


export const HabitPage: React.FC<HabitPageProps> = ({ habits, onToggleHabit }) => {
  const groupedHabits = habits.reduce((acc, habit) => {
    const period = habit.period;
    if (!acc[period]) {
      acc[period] = [];
    }
    acc[period].push(habit);
    return acc;
  }, {} as Record<string, Habit[]>);

  return (
    <div className="p-8 flex-1 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-4 text-content-primary">Habit</h1>
        <WeeklyCalendarHeader />

        <div className="space-y-8">
            {/* Fix: Use Object.keys to iterate over grouped habits to ensure correct typing */}
            {Object.keys(groupedHabits).map((period) => {
                const periodHabits = groupedHabits[period];
                return (
                    <div key={period}>
                        <h2 className="text-lg font-semibold text-content-secondary mb-3">{period} <span className="text-sm font-normal text-content-tertiary">{periodHabits.length}</span></h2>
                        <div className="space-y-3">
                            {periodHabits.map(habit => (
                                <HabitItem key={habit.id} habit={habit} onToggleHabit={onToggleHabit} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};
