import React, { useState, useMemo } from 'react';
import { Task, PomodoroSession, List } from '../types.ts';

interface CalendarPageProps {
  tasks: Task[];
  sessions: PomodoroSession[];
  lists: List[];
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ tasks, sessions, lists }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sunday

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const eventsByDate = useMemo(() => {
    const events: Record<string, { title: string, color: string }[]> = {};
    const activeTasks = tasks.filter(t => !t.completed && !t.wontDo && !t.trashed);
    
    activeTasks.forEach(task => {
        if (task.dueDate) {
            const dateStr = task.dueDate.split(' ')[0]; // YYYY-MM-DD
            if (!events[dateStr]) events[dateStr] = [];
            const list = lists.find(l => l.id === task.listId);
            events[dateStr].push({ title: task.title, color: list?.color || '#6B6B6B' });
        }
    });

    sessions.forEach(session => {
        const date = new Date(session.startTime);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        if (!events[dateStr]) events[dateStr] = [];
        events[dateStr].push({ title: `Focus: ${session.taskName}`, color: '#F5A623' });
    });

    return events;
  }, [tasks, sessions, lists]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6 flex flex-col h-full bg-background-primary text-content-primary">
      <header className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-content-primary">{monthName}</h1>
        <div className="flex items-center space-x-2">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-md hover:bg-background-tertiary text-content-secondary">&lt;</button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm rounded-md hover:bg-background-tertiary border border-border-primary text-content-secondary">Today</button>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-md hover:bg-background-tertiary text-content-secondary">&gt;</button>
        </div>
      </header>

      <div className="grid grid-cols-7 grid-rows-[auto,1fr] gap-px bg-border-primary border-t border-l border-border-primary flex-1">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center py-2 text-xs font-bold text-content-secondary bg-background-secondary border-b border-r border-border-primary">{day}</div>
        ))}

        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="bg-background-secondary/50 border-b border-r border-border-primary"></div>)}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = eventsByDate[dateStr] || [];
          const isToday = new Date().toDateString() === dayDate.toDateString();

          return (
            <div key={day} className="bg-background-primary p-2 border-b border-r border-border-primary flex flex-col min-h-[120px] relative">
              <div className={`font-semibold text-sm ${isToday ? 'text-primary' : 'text-content-secondary'}`}>{day}</div>
              <div className="flex-1 overflow-y-auto mt-1 space-y-1 text-xs -mr-1 pr-1">
                {dayEvents.map((event, index) => (
                  <div key={index} className="p-1 rounded flex items-center" style={{ backgroundColor: `${event.color}20`}}>
                     <div className="w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0" style={{ backgroundColor: event.color }}></div>
                     <span className="truncate" style={{ color: event.color }}>{event.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
