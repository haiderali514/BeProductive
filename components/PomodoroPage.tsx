import React, { useState, useEffect, useMemo } from 'react';
import { PomodoroSession, Task } from '../types';

interface PomodoroPageProps {
    sessions: PomodoroSession[];
    onAddSession: (session: Omit<PomodoroSession, 'id'>) => void;
    tasks: Task[];
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

interface TaskSelectorProps {
    tasks: Task[];
    selectedTaskId: string | null;
    onSelectTask: (taskId: string | null) => void;
    disabled: boolean;
}

const TaskSelector: React.FC<TaskSelectorProps> = ({ tasks, selectedTaskId, onSelectTask, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    // Only show tasks that are not completed
    const availableTasks = useMemo(() => tasks.filter(task => !task.completed), [tasks]);
    const selectedTask = useMemo(() => availableTasks.find(task => task.id === selectedTaskId), [availableTasks, selectedTaskId]);

    const handleSelect = (taskId: string) => {
        onSelectTask(taskId);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg flex justify-between items-center text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className={`truncate ${selectedTask ? 'text-content-primary' : 'text-content-secondary'}`}>
                    {selectedTask ? selectedTask.title : 'Select a task to focus on'}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-content-secondary transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-background-tertiary rounded-lg shadow-lg max-h-60 overflow-y-auto border border-border-primary">
                    <ul className="py-1">
                        {availableTasks.length > 0 ? (
                            availableTasks.map(task => (
                                <li
                                    key={task.id}
                                    onClick={() => handleSelect(task.id)}
                                    className="px-4 py-2 text-content-primary hover:bg-primary hover:text-primary-content cursor-pointer truncate"
                                >
                                    {task.title}
                                </li>
                            ))
                        ) : (
                            <li className="px-4 py-2 text-content-secondary">No available tasks.</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};


interface TimerProps {
    onAddSession: PomodoroPageProps['onAddSession'];
    tasks: Task[];
    selectedTaskId: string | null;
    setSelectedTaskId: React.Dispatch<React.SetStateAction<string | null>>;
}


const Timer: React.FC<TimerProps> = ({ onAddSession, tasks, selectedTaskId, setSelectedTaskId }) => {
    const FOCUS_DURATION = 90 * 60; // 90 minutes
    const [timeRemaining, setTimeRemaining] = useState(FOCUS_DURATION);
    const [isActive, setIsActive] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);

    useEffect(() => {
        let interval: number | null = null;
        if (isActive) {
            interval = window.setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        setIsActive(false);
                        const taskName = tasks.find(t => t.id === selectedTaskId)?.title || 'Focus Session';
                        onAddSession({ startTime: startTime!, endTime: Date.now(), taskName });
                        return FOCUS_DURATION;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, startTime, onAddSession, tasks, selectedTaskId]);

    const handleStart = () => {
        if (!isActive) {
            setStartTime(Date.now());
            setIsActive(true);
        }
    };
    
    const handlePause = () => setIsActive(false);
    
    const handleReset = () => {
        setIsActive(false);
        setTimeRemaining(FOCUS_DURATION);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="w-64 h-64 rounded-full border-8 border-background-tertiary flex items-center justify-center mb-8">
                <h2 className="text-6xl font-mono text-content-primary">{formatTime(timeRemaining)}</h2>
            </div>
            <div className="mb-8 w-80">
                <TaskSelector
                    tasks={tasks}
                    selectedTaskId={selectedTaskId}
                    onSelectTask={setSelectedTaskId}
                    disabled={isActive}
                />
            </div>
            {isActive ? (
                <div className="flex space-x-4">
                     <button onClick={handlePause} className="px-10 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-focus transition-colors">Pause</button>
                     <button onClick={handleReset} className="px-10 py-3 bg-background-tertiary text-content-primary rounded-lg font-semibold hover:bg-border-primary transition-colors">End</button>
                </div>
            ) : (
                <button onClick={handleStart} className="px-16 py-4 bg-primary text-white rounded-lg font-semibold text-lg hover:bg-primary-focus transition-colors">
                    {timeRemaining < FOCUS_DURATION ? 'Continue' : 'Start'}
                </button>
            )}
        </div>
    );
}

const FocusOverview: React.FC<{ sessions: PomodoroSession[] }> = ({ sessions }) => {
    
    const { todayDuration, totalDuration, groupedSessions } = useMemo(() => {
        let todayMs = 0;
        let totalMs = 0;
        const today = new Date().toDateString();

        const grouped = sessions.reduce((acc, session) => {
            const date = new Date(session.startTime).toDateString();
            if (!acc[date]) acc[date] = [];
            acc[date].push(session);
            return acc;
        }, {} as Record<string, PomodoroSession[]>);

        sessions.forEach(s => {
            const duration = s.endTime - s.startTime;
            totalMs += duration;
            if(new Date(s.startTime).toDateString() === today) {
                todayMs += duration;
            }
        });

        const formatMs = (ms: number) => {
            const hours = Math.floor(ms / (1000 * 60 * 60));
            const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${minutes}m`;
        }

        return {
            todayDuration: formatMs(todayMs),
            totalDuration: formatMs(totalMs),
            groupedSessions: grouped,
        }

    }, [sessions]);


    const formatSessionTime = (startTime: number, endTime: number) => {
        const start = new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const end = new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${start} - ${end}`;
    };

    const formatDuration = (startTime: number, endTime: number) => {
        const durationMs = endTime - startTime;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
    };

    return (
        <div className="w-[350px] bg-background-secondary p-6 border-l border-border-primary overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Overview</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-background-tertiary p-4 rounded-lg">
                    <p className="text-sm text-content-secondary">Today's Pomos</p>
                    <p className="text-lg font-bold">{sessions.filter(s => new Date(s.startTime).toDateString() === new Date().toDateString()).length}</p>
                </div>
                <div className="bg-background-tertiary p-4 rounded-lg">
                    <p className="text-sm text-content-secondary">Today's Focus</p>
                    <p className="text-lg font-bold">{todayDuration}</p>
                </div>
                <div className="bg-background-tertiary p-4 rounded-lg">
                    <p className="text-sm text-content-secondary">Total Pomos</p>
                    <p className="text-lg font-bold">{sessions.length}</p>
                </div>
                 <div className="bg-background-tertiary p-4 rounded-lg">
                    <p className="text-sm text-content-secondary">Total Focus</p>
                    <p className="text-lg font-bold">{totalDuration}</p>
                </div>
            </div>
            <h3 className="font-bold mb-4">Focus Record</h3>
            <div className="space-y-4">
                {/* Fix: Use Object.keys to iterate over grouped sessions to ensure correct typing */}
                {Object.keys(groupedSessions).map((date) => {
                    const dateSessions = groupedSessions[date];
                    return (
                        <div key={date}>
                            <p className="text-sm text-content-secondary mb-2">{new Date(date).toLocaleDateString(undefined, { month: 'long', day: 'numeric'})}</p>
                            <div className="border-l-2 border-border-primary pl-4 space-y-4">
                                {dateSessions.map(session => (
                                    <div key={session.id} className="relative">
                                        <div className="absolute -left-[21px] top-1 w-3 h-3 bg-primary rounded-full border-2 border-background-secondary"></div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-xs text-content-secondary">{formatSessionTime(session.startTime, session.endTime)}</p>
                                                <p className="font-medium">{session.taskName}</p>
                                            </div>
                                            <p className="text-sm text-content-secondary">{formatDuration(session.startTime, session.endTime)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export const PomodoroPage: React.FC<PomodoroPageProps> = ({ sessions, onAddSession, tasks }) => {
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    // When tasks change, if the selected task is now completed or deleted, deselect it.
    useEffect(() => {
        if (selectedTaskId) {
            const task = tasks.find(t => t.id === selectedTaskId);
            if (!task || task.completed) {
                setSelectedTaskId(null);
            }
        }
    }, [tasks, selectedTaskId]);

    return (
        <div className="flex flex-1">
            <div className="flex-1">
                <Timer
                    onAddSession={onAddSession}
                    tasks={tasks}
                    selectedTaskId={selectedTaskId}
                    setSelectedTaskId={setSelectedTaskId}
                />
            </div>
            <FocusOverview sessions={sessions} />
        </div>
    );
};