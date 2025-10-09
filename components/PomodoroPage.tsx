

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PomodoroSession, Task, Habit } from '../types';
import { TaskSelectorPopover } from './TaskSelectorPopover';
import { AddFocusRecordModal } from './AddFocusRecordModal';
import { ResizablePanel } from './ResizablePanel';

interface PomodoroPageProps {
    sessions: PomodoroSession[];
    onAddSession: (session: Omit<PomodoroSession, 'id'>) => void;
    tasks: Task[];
    habits: Habit[];
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const FocusOverview: React.FC<{ sessions: PomodoroSession[]; onAddManual: () => void }> = ({ sessions, onAddManual }) => {
    const { todayDuration, totalDuration, groupedSessions, todayPomos, totalPomos } = useMemo(() => {
        let todayMs = 0;
        let totalMs = 0;
        const today = new Date().toDateString();

        const grouped = [...sessions].sort((a,b) => b.startTime - a.startTime).reduce((acc, session) => {
            const date = new Date(session.startTime).toDateString();
            if (!acc[date]) acc[date] = [];
            acc[date].push(session);
            return acc;
        }, {} as Record<string, PomodoroSession[]>);

        let todayPomos = 0;
        sessions.forEach(s => {
            const duration = s.endTime - s.startTime;
            totalMs += duration;
            if(new Date(s.startTime).toDateString() === today) {
                todayMs += duration;
                todayPomos++;
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
            todayPomos,
            totalPomos: sessions.length
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
        <div className="p-6 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-4">Overview</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-background-tertiary p-4 rounded-lg min-h-[110px]">
                    <div className="h-8">
                        <p className="text-sm text-content-secondary truncate">Today's Pomo</p>
                    </div>
                    <p className="text-2xl font-bold text-content-primary truncate">{todayPomos}</p>
                    <div className="h-4"></div>
                </div>
                <div className="bg-background-tertiary p-4 rounded-lg min-h-[110px]">
                    <div className="h-8">
                        <p className="text-sm text-content-secondary truncate">Today's Focus</p>
                    </div>
                    <p className="text-2xl font-bold text-content-primary truncate">{todayDuration}</p>
                    <div className="h-4"></div>
                </div>
                <div className="bg-background-tertiary p-4 rounded-lg min-h-[110px]">
                    <div className="h-8">
                        <p className="text-sm text-content-secondary truncate">Total Pomo</p>
                    </div>
                    <p className="text-2xl font-bold text-content-primary truncate">{totalPomos}</p>
                    <div className="h-4"></div>
                </div>
                <div className="bg-background-tertiary p-4 rounded-lg min-h-[110px]">
                    <div className="h-8">
                        <p className="text-sm text-content-secondary truncate">Total Focus Duration</p>
                    </div>
                    <p className="text-2xl font-bold text-content-primary truncate">{totalDuration}</p>
                    <div className="h-4"></div>
                </div>
            </div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Focus Record</h3>
                <button onClick={onAddManual} className="text-content-secondary hover:text-primary p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto -mr-2 pr-2">
                {Object.keys(groupedSessions).map((date) => (
                    <div key={date}>
                        <p className="text-sm text-content-secondary mb-2">{new Date(date).toLocaleDateString(undefined, { month: 'long', day: 'numeric'})}</p>
                        <div className="border-l-2 border-border-primary pl-4 space-y-4">
                            {groupedSessions[date].map(session => (
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
                ))}
            </div>
        </div>
    );
}

export const PomodoroPage: React.FC<PomodoroPageProps> = ({ sessions, onAddSession, tasks, habits }) => {
    const FOCUS_DURATION = 90 * 60;
    const [timeRemaining, setTimeRemaining] = useState(FOCUS_DURATION);
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [selectedFocus, setSelectedFocus] = useState<{ id: string; name: string; type: 'task' | 'habit' } | null>(null);
    const [focusNote, setFocusNote] = useState('');
    const [isTaskSelectorOpen, setTaskSelectorOpen] = useState(false);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [now, setNow] = useState(new Date());

    const intervalRef = useRef<number | null>(null);

    const stopTimer = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => {
        if (isActive && !isPaused) {
            intervalRef.current = window.setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        stopTimer();
                        handleEnd(true); // Auto-finish
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            stopTimer();
        }
        return stopTimer;
    }, [isActive, isPaused]);
    
    useEffect(() => {
        if (isActive && !isPaused) {
            const timerId = setInterval(() => setNow(new Date()), 1000);
            return () => clearInterval(timerId);
        }
    }, [isActive, isPaused]);

    const handleStart = () => {
        if (selectedFocus) {
            const now = Date.now();
            setStartTime(now);
            setIsActive(true);
            setIsPaused(false);
        } else {
            setTaskSelectorOpen(true);
        }
    };
    
    const handlePause = () => setIsPaused(true);
    const handleContinue = () => setIsPaused(false);
    
    const handleEnd = (autoFinish = false) => {
        stopTimer();
        if (startTime) {
             onAddSession({
                startTime,
                endTime: Date.now(),
                taskName: selectedFocus?.name || 'Focus Session',
                taskId: selectedFocus?.id,
                note: focusNote,
            });
        }
       
        setIsActive(false);
        setIsPaused(false);
        setTimeRemaining(FOCUS_DURATION);
        setStartTime(null);
        setFocusNote('');

        if (autoFinish) {
            console.log("Session finished!");
        }
    };

    const sessionEndTime = startTime ? startTime + (FOCUS_DURATION * 1000) : 0;

    const formatHour = (date: Date) => date.getHours();
    
    const { timelineStartHour, timelineEndHour, totalHours, sessionStartPercent, sessionDurationPercent, progressPercent } = useMemo(() => {
        const startHour = startTime ? Math.max(0, formatHour(new Date(startTime)) - 1) : 15;
        const endHour = startTime ? Math.min(23, formatHour(new Date(sessionEndTime)) + 1) : 19;
        const total = Math.max(1, endHour - startHour);

        const startPercent = startTime ? ((new Date(startTime).getHours() * 60 + new Date(startTime).getMinutes()) - (startHour * 60)) / (total * 60) * 100 : 0;
        const durationPercent = startTime ? ((sessionEndTime - startTime) / (1000 * 60)) / (total * 60) * 100 : 0;
        
        const elapsedMs = startTime ? Math.max(0, now.getTime() - startTime) : 0;
        const totalDurationMs = FOCUS_DURATION * 1000;
        const progPercent = Math.min(100, (elapsedMs / totalDurationMs) * 100);

        return {
            timelineStartHour: startHour,
            timelineEndHour: endHour,
            totalHours: total,
            sessionStartPercent: startPercent,
            sessionDurationPercent: durationPercent,
            progressPercent: progPercent,
        };
    }, [startTime, sessionEndTime, now]);
    

    return (
        <>
            <ResizablePanel
                storageKey="pomodoro-overview-width"
                panelSide="right"
                initialWidth={400}
                minWidth={320}
                maxWidth={600}
            >
                {/* Panel Content (child 1) */}
                <div className="bg-background-secondary h-full overflow-y-auto">
                    {isActive ? (
                         <div className="p-6 flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center space-x-2">
                                    <span className="text-lg">🎮</span>
                                    <p className="font-semibold">Welcome to your AI-powered todo list!</p>
                                </div>
                                <div className="flex items-center space-x-2 text-content-tertiary">
                                    <button className="p-1 hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg></button>
                                    <button className="p-1 hover:text-primary" onClick={() => handleEnd(false)}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                                </div>
                            </div>
                            <div className="bg-background-tertiary rounded-lg p-4 flex-grow flex flex-col">
                                <div className="relative flex-shrink-0" style={{ height: `${(totalHours + 1) * 2}rem` }}>
                                    {Array.from({ length: totalHours + 1 }).map((_, i) => (
                                        <div key={i} className="flex items-start h-8 text-xs text-content-tertiary">
                                            <span className="w-6">{timelineStartHour + i}</span>
                                            <div className="flex-1 border-t border-dashed border-border-primary mt-2"></div>
                                        </div>
                                    ))}
                                    <div className="absolute top-0 left-6 right-0 bottom-0">
                                        <div className="absolute w-full bg-yellow-500/20 border-l-2 border-red-500 overflow-hidden" style={{ top: `${sessionStartPercent}%`, height: `${sessionDurationPercent}%` }}>
                                            <div className="absolute -left-[3.5px] -top-[3.5px] w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                            <div className="absolute top-0 left-0 w-full bg-primary/40 transition-all duration-1000 linear" style={{ height: `${progressPercent}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                <h4 className="font-semibold mt-auto pt-4 mb-2">Focus Note</h4>
                                <textarea
                                    value={focusNote}
                                    onChange={(e) => setFocusNote(e.target.value)}
                                    placeholder="What do you have in mind?"
                                    className="w-full h-24 bg-background-primary border border-border-primary rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                ></textarea>
                            </div>
                        </div>
                    ) : (
                        <FocusOverview sessions={sessions} onAddManual={() => setAddModalOpen(true)} />
                    )}
                </div>

                {/* Main Content (child 2) */}
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    {isActive ? (
                        <>
                             <p className="text-content-secondary mb-4">{selectedFocus?.name || 'Focus'}</p>
                             <div className="w-[400px] h-[400px] rounded-full border-[10px] border-background-tertiary flex items-center justify-center mb-8">
                                <div className="text-center">
                                    <p className={`text-8xl font-mono transition-colors ${isPaused ? 'text-content-tertiary' : 'text-content-primary'}`}>
                                        {formatTime(timeRemaining)}
                                    </p>
                                    {isPaused && <p className="text-yellow-500 font-semibold mt-2 text-lg">Paused</p>}
                                    <p className="text-base text-content-tertiary mt-2">
                                        {startTime && `${new Date(startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(sessionEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                                    </p>
                                </div>
                            </div>
                             <div className="flex space-x-4">
                                {isPaused ? (
                                    <>
                                        <button onClick={handleContinue} className="px-10 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-focus transition-colors">Continue</button>
                                        {/* FIX: Wrap handleEnd in an arrow function to prevent passing the event object as the first argument, which caused a type error. */}
                                        <button onClick={() => handleEnd(false)} className="px-10 py-3 bg-transparent border-2 border-primary text-primary rounded-full font-semibold hover:bg-primary/10 transition-colors">End</button>
                                    </>
                                ) : (
                                     <button onClick={handlePause} className="px-16 py-4 bg-transparent border-2 border-primary text-primary rounded-full font-semibold text-lg hover:bg-primary/10 transition-colors">Pause</button>
                                )}
                             </div>
                        </>
                    ) : (
                        <>
                            <div className="flex space-x-2 mb-8">
                                <button className="px-4 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-semibold">Pomo</button>
                                <button className="px-4 py-1.5 rounded-full hover:bg-background-tertiary text-content-secondary text-sm font-semibold">Stopwatch</button>
                            </div>
                            
                            <div className="text-center mb-8">
                                <TaskSelectorPopover
                                    isOpen={isTaskSelectorOpen}
                                    onClose={() => setTaskSelectorOpen(false)}
                                    onSelect={setSelectedFocus}
                                    tasks={tasks}
                                    habits={habits}
                                >
                                     <button onClick={() => setTaskSelectorOpen(true)} className="text-lg text-content-secondary hover:text-content-primary transition-colors">
                                        {selectedFocus?.name || 'Focus'} &gt;
                                    </button>
                                </TaskSelectorPopover>
                            </div>
    
                            <div className="w-[400px] h-[400px] rounded-full border-[10px] border-background-secondary flex items-center justify-center mb-8">
                                <h2 className="text-7xl font-mono text-content-primary">{formatTime(timeRemaining)}</h2>
                            </div>
                            
                            <button onClick={handleStart} className="px-16 py-4 bg-primary text-white rounded-full font-semibold text-lg hover:bg-primary-focus transition-colors">
                                Start
                            </button>
                        </>
                    )}
                </div>
            </ResizablePanel>

            <AddFocusRecordModal 
                isOpen={isAddModalOpen}
                onClose={() => setAddModalOpen(false)}
                onAddSession={onAddSession}
                tasks={tasks}
                habits={habits}
                sessions={sessions}
            />
        </>
    );
};