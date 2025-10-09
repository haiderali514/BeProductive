import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Task, PomodoroSession, List } from '../types';

type CalendarViewType = 'month' | 'week' | 'day';
type CalendarEvent = {
  id: string;
  title: string;
  type: 'task' | 'pomodoro';
  color: string;
  startTime?: Date;
  endTime?: Date;
  data: Task | PomodoroSession;
};

type CalendarEventsByDate = Record<string, {
  allDay: CalendarEvent[];
  timed: CalendarEvent[];
}>;


interface CalendarPageProps {
  tasks: Task[];
  sessions: PomodoroSession[];
  lists: List[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

const toYYYYMMDD = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const Header: React.FC<{
    currentDate: Date;
    view: CalendarViewType;
    onViewChange: (view: CalendarViewType) => void;
    onDateChange: (newDate: Date) => void;
}> = ({ currentDate, view, onViewChange, onDateChange }) => {
    
    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
        else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
        else newDate.setDate(newDate.getDate() - 1);
        onDateChange(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
        else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
        else newDate.setDate(newDate.getDate() - 1);
        onDateChange(newDate);
    };

    const handleToday = () => {
        onDateChange(new Date());
    };

    const title = useMemo(() => {
        if (view === 'month') return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (view === 'week') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return `${startOfWeek.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} - ${endOfWeek.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}`;
        }
        return currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' });
    }, [currentDate, view]);

    return (
        <header className="p-4 md:p-6 border-b border-border-primary flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center space-x-2">
                <button onClick={handleToday} className="px-4 py-2 border border-border-primary rounded-lg font-semibold hover:bg-background-secondary transition-colors">Today</button>
                <div className="flex items-center">
                    <button onClick={handlePrev} aria-label="Previous period" className="p-2 rounded-full hover:bg-background-secondary">&lt;</button>
                    <button onClick={handleNext} aria-label="Next period" className="p-2 rounded-full hover:bg-background-secondary">&gt;</button>
                </div>
                <h2 className="text-xl font-bold">{title}</h2>
            </div>
            <div className="flex space-x-1 bg-background-secondary p-1 rounded-lg">
                {(['month', 'week', 'day'] as CalendarViewType[]).map(v => (
                    <button key={v} onClick={() => onViewChange(v)} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${view === v ? 'bg-primary text-white' : 'hover:bg-background-tertiary'}`}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                ))}
            </div>
        </header>
    );
};

const MonthView: React.FC<{ currentDate: Date; events: CalendarEventsByDate; onUpdateTask: CalendarPageProps['onUpdateTask'] }> = ({ currentDate, events, onUpdateTask }) => {
    const today = new Date();
    
    const { days, firstDayOfMonth } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        return {
            days: Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
            firstDayOfMonth,
        };
    }, [currentDate]);

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, date: Date) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        if(taskId) {
            onUpdateTask(taskId, { dueDate: toYYYYMMDD(date) });
        }
    };

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-7 gap-px bg-border-primary border-t border-r border-border-primary min-h-full">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-background-secondary p-2 text-center text-xs font-bold text-content-tertiary">{day}</div>
                ))}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="bg-background-secondary min-h-[120px] border-b border-l border-border-primary"></div>)}
                {days.map(day => {
                    const dayStr = toYYYYMMDD(day);
                    const dayData = events[dayStr];
                    const dayEvents = dayData ? [...dayData.allDay, ...dayData.timed] : [];
                    const isToday = toYYYYMMDD(today) === dayStr;
                    return (
                        <div key={dayStr} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, day)} className="bg-background-primary p-2 flex flex-col min-h-[120px] overflow-hidden border-b border-l border-border-primary">
                            <span className={`text-sm font-semibold mb-2 ${isToday ? 'bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>{day.getDate()}</span>
                            <div className="flex-1 space-y-1 overflow-y-auto -mr-2 pr-2">
                            {dayEvents.map(event => (
                                    <div 
                                        key={event.id}
                                        draggable={event.type === 'task'}
                                        onDragStart={(e) => event.type === 'task' && handleDragStart(e, event.id)}
                                        className={`p-1.5 rounded-md text-xs truncate ${event.type === 'task' ? 'cursor-grab' : ''}`}
                                        style={{ backgroundColor: `${event.color}30`, color: event.color, borderLeft: `3px solid ${event.color}`}}
                                        title={event.title}
                                    >
                                        <span className="font-semibold">{event.title}</span>
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

const TimeAxisView: React.FC<{ currentDate: Date; view: 'week' | 'day'; events: CalendarEventsByDate; onUpdateTask: CalendarPageProps['onUpdateTask'] }> = ({ currentDate, view, events, onUpdateTask }) => {
    const days = useMemo(() => {
        if (view === 'day') return [currentDate];
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - startOfWeek.getDay());
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            return d;
        });
    }, [currentDate, view]);

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // update every minute
        return () => clearInterval(timer);
    }, []);

    const nowPosition = (now.getHours() + now.getMinutes() / 60) / 24 * 100;
    
    const handleDragStart = (e: React.DragEvent, taskId: string, originalDate?: Date) => {
        e.dataTransfer.setData("taskId", taskId);
        e.dataTransfer.effectAllowed = 'move';
        if (originalDate) {
            e.dataTransfer.setData("originalDate", originalDate.toISOString());
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    
    const handleDrop = (e: React.DragEvent, date: Date, hour?: number) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        const originalDateStr = e.dataTransfer.getData("originalDate");

        if (taskId) {
            if (hour !== undefined) { // Dropped on a timed slot
                const originalDate = originalDateStr ? new Date(originalDateStr) : new Date();
                const minutes = originalDate.getMinutes();
                const newDate = new Date(date);
                newDate.setHours(hour, minutes, 0, 0);
                
                const pad = (num: number) => String(num).padStart(2, '0');
                const newDueDate = `${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())} ${pad(newDate.getHours())}:${pad(newDate.getMinutes())}`;
                onUpdateTask(taskId, { dueDate: newDueDate });

            } else { // Dropped on an all-day slot
                onUpdateTask(taskId, { dueDate: toYYYYMMDD(date) });
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 flex border-b border-border-primary">
                <div className="w-16 flex-shrink-0"></div>
                {days.map(day => (
                    <div key={day.toISOString()} className="flex-1 text-center py-2 border-l border-border-primary">
                        <span className="text-xs text-content-secondary">{day.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                        <p className={`text-2xl font-bold ${toYYYYMMDD(day) === toYYYYMMDD(new Date()) ? 'text-primary' : ''}`}>{day.getDate()}</p>
                    </div>
                ))}
            </div>
            <div className="flex-shrink-0 flex border-b border-border-primary">
                <div className="w-16 flex-shrink-0 pt-2 text-right pr-2 text-xs text-content-tertiary">All-day</div>
                {days.map(day => {
                    const dayStr = toYYYYMMDD(day);
                    const allDayEvents = events[dayStr]?.allDay || [];
                    return (
                        <div
                            key={day.toISOString()}
                            className="flex-1 border-l border-border-primary p-1 min-h-[34px]"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, day)}
                        >
                            <div className="space-y-1">
                                {allDayEvents.map(event => (
                                    <div
                                        key={event.id}
                                        draggable={event.type === 'task'}
                                        onDragStart={(e) => event.type === 'task' && handleDragStart(e, event.id)}
                                        className="p-1.5 rounded-md text-xs truncate cursor-grab"
                                        style={{ backgroundColor: `${event.color}30`, color: event.color, borderLeft: `3px solid ${event.color}` }}
                                        title={event.title}
                                    >
                                        <span className="font-semibold">{event.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="flex-1 overflow-y-auto">
                <div className="flex relative">
                    <div className="w-16 flex-shrink-0">
                        {hours.map(hour => (
                            <div key={hour} className="h-24 border-t border-border-primary text-right pr-2 pt-1 text-xs text-content-tertiary">
                                {hour > 0 ? `${String(hour).padStart(2,'0')}:00` : ''}
                            </div>
                        ))}
                    </div>
                    {days.map(day => {
                        const dayStr = toYYYYMMDD(day);
                        const timedEvents = events[dayStr]?.timed || [];
                        const isToday = toYYYYMMDD(day) === toYYYYMMDD(now);
                        return (
                            <div key={day.toISOString()} className="flex-1 border-l border-border-primary relative">
                                {hours.map(hour => 
                                    <div 
                                        key={hour} 
                                        className="h-24 border-t border-dashed border-border-primary/50"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, day, hour)}
                                    ></div>
                                )}
                                {isToday && (
                                    <div className="absolute w-full h-px bg-red-500 z-10" style={{ top: `${nowPosition}%` }}>
                                        <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                                    </div>
                                )}
                                {timedEvents.map(event => {
                                    if(!event.startTime || !event.endTime) return null;
                                    const startHour = event.startTime.getHours() + event.startTime.getMinutes() / 60;
                                    const endHour = event.endTime.getHours() + event.endTime.getMinutes() / 60;
                                    
                                    const safeEndHour = endHour < startHour ? 24 : endHour;

                                    const top = (startHour / 24) * 100;
                                    let height = ((safeEndHour - startHour) / 24) * 100;
                                    
                                    const minHeightPercent = (15 / 60 / 24) * 100; // 15 minutes min height
                                    height = Math.max(height, minHeightPercent);
                                    
                                    const isPomodoro = event.type === 'pomodoro';

                                    return (
                                        <div 
                                            key={event.id}
                                            draggable={event.type === 'task'}
                                            onDragStart={(e) => event.type === 'task' && handleDragStart(e, event.id, event.startTime)}
                                            className={`absolute w-[calc(100%-8px)] left-1 p-1 rounded-md text-xs overflow-hidden flex flex-col ${event.type === 'task' ? 'cursor-grab' : ''}`} 
                                            style={{ 
                                                top: `${top}%`, 
                                                height: `${height}%`,
                                                backgroundColor: isPomodoro ? `${event.color}40` : `${event.color}30`, 
                                                color: event.color, 
                                                borderLeft: isPomodoro ? 'none' : `3px solid ${event.color}`
                                            }}
                                            title={`${event.title} (${event.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`}
                                        >
                                            <span className="font-semibold truncate">{event.title}</span>
                                            {height > 2 && <p className="opacity-80 truncate">{event.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


export const CalendarPage: React.FC<CalendarPageProps> = ({ tasks, sessions, lists, onUpdateTask }) => {
    const [view, setView] = useState<CalendarViewType>('month');
    const [currentDate, setCurrentDate] = useState(new Date());

    const listColorMap = useMemo(() => {
        const colors = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#9013FE', '#F8E71C', '#D0021B', '#7ED321'];
        return lists.reduce((acc, list, index) => {
            acc[list.id] = list.color || colors[index % colors.length];
            return acc;
        }, {} as Record<string, string>);
    }, [lists]);
    
    const eventsByDate = useMemo(() => {
        const events: CalendarEventsByDate = {};
        
        const ensureDate = (dateStr: string) => {
            if (!events[dateStr]) {
                events[dateStr] = { allDay: [], timed: [] };
            }
        };

        const activeTasks = tasks.filter(t => !t.completed && !t.wontDo && !t.trashed);
        
        // Process tasks
        activeTasks.forEach(task => {
            if (task.dueDate) {
                const hasTime = task.dueDate.includes(' ');
                const dateStr = task.dueDate.split(' ')[0];
                ensureDate(dateStr);
                
                const event: CalendarEvent = {
                    id: task.id,
                    title: task.title,
                    type: 'task',
                    color: listColorMap[task.listId] || '#6B6B6B',
                    data: task,
                    startTime: hasTime ? new Date(task.dueDate.replace(' ', 'T')) : undefined,
                    endTime: hasTime ? new Date(new Date(task.dueDate.replace(' ', 'T')).getTime() + 30 * 60000) : undefined,
                };

                if (hasTime) {
                    events[dateStr].timed.push(event);
                } else {
                    events[dateStr].allDay.push(event);
                }
            }
        });

        // Process pomodoro sessions
        sessions.forEach(session => {
            const dateStr = toYYYYMMDD(new Date(session.startTime));
            ensureDate(dateStr);
            events[dateStr].timed.push({
                id: session.id,
                title: session.taskName,
                type: 'pomodoro',
                color: '#F5A623',
                startTime: new Date(session.startTime),
                endTime: new Date(session.endTime),
                data: session,
            });
        });

        // Sort timed events by start time for proper rendering
        for (const dateStr in events) {
            events[dateStr].timed.sort((a, b) => a.startTime!.getTime() - b.startTime!.getTime());
        }

        return events;
    }, [tasks, sessions, listColorMap]);

    const renderView = () => {
        switch (view) {
            case 'month':
                return <MonthView currentDate={currentDate} events={eventsByDate} onUpdateTask={onUpdateTask} />;
            case 'week':
            case 'day':
                return <TimeAxisView currentDate={currentDate} view={view} events={eventsByDate} onUpdateTask={onUpdateTask}/>;
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col bg-background-primary text-content-primary">
            <Header currentDate={currentDate} view={view} onViewChange={setView} onDateChange={setCurrentDate} />
            {renderView()}
        </div>
    );
};