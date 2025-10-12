import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PomodoroSession, Task, Habit } from '../types';
import { TaskSelectorPopover } from './TaskSelectorPopover';
import { AddFocusRecordModal } from './AddFocusRecordModal';
import { ResizablePanel } from './ResizablePanel';
import { useSettings } from '../contexts/SettingsContext';
import { PomodoroIcon, MoreIcon, PlusIcon, TodayIcon, CountdownIcon, BrainIcon, BoltSolidIcon, ChartPieSolidIcon, CheckCircleSolidIcon, FireSolidIcon } from './Icons';
import { CircularProgress } from './CircularProgress';

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

const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: React.ReactNode;
}> = ({ icon, title, value }) => {
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
        </div>
    );
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
            if (hours === 0 && minutes === 0) return "0m";
            return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
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
        const minutes = Math.floor(durationMs / (1000 * 60));
        return `${minutes}m`;
    };

    return (
        <div className="flex flex-col h-full">
            <div className="grid grid-cols-2 gap-4 mb-8">
                <StatCard icon={<TodayIcon className="w-4 h-4" />} title="Today's Pomo" value={todayPomos} />
                <StatCard icon={<CountdownIcon className="w-4 h-4" />} title="Today's Focus" value={todayDuration} />
                <StatCard icon={<PomodoroIcon className="w-4 h-4" />} title="Total Pomo" value={totalPomos} />
                <StatCard icon={<BrainIcon className="w-4 h-4" />} title="Total Focus" value={totalDuration} />
            </div>

            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Focus Record</h3>
                 <div className="flex items-center space-x-2">
                    <button onClick={onAddManual} className="text-content-secondary hover:text-primary p-1 rounded-full"><PlusIcon /></button>
                    <button className="text-content-secondary hover:text-primary p-1 rounded-full"><MoreIcon /></button>
                </div>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto -mr-2 pr-2">
                {Object.keys(groupedSessions).length > 0 ? Object.keys(groupedSessions).map((date) => (
                    <div key={date}>
                        <p className="text-xs text-content-secondary mb-2">{new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</p>
                        <div className="space-y-3">
                            {groupedSessions[date].map(session => (
                                <div key={session.id} className="relative flex items-center space-x-4">
                                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full bg-primary/20"><PomodoroIcon className="w-3 h-3 text-primary" /></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{session.taskName}</p>
                                        <p className="text-xs text-content-secondary">{formatSessionTime(session.startTime, session.endTime)}</p>
                                    </div>
                                    <p className="text-sm text-content-secondary">{formatDuration(session.startTime, session.endTime)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )) : (
                    <p className="text-sm text-center text-content-tertiary pt-8">No focus records yet.</p>
                )}
            </div>
        </div>
    );
};

const ActiveFocusPanel: React.FC<{
    startTime: number;
    durationSeconds: number;
    now: Date;
    note: string;
    onNoteChange: (note: string) => void;
}> = ({ startTime, durationSeconds, now, note, onNoteChange }) => {
    const { timelineStartHour, totalHours, sessionStartPercent, sessionDurationPercent, progressPercent, currentTimePercent } = useMemo(() => {
        const sessionStartTime = new Date(startTime);
        const sessionEndTime = new Date(startTime + durationSeconds * 1000);

        const startHour = Math.max(0, sessionStartTime.getHours());
        const endHour = Math.min(23, sessionEndTime.getHours() + 1);
        const total = Math.max(1, endHour - startHour);

        const startOffsetMinutes = (sessionStartTime.getHours() - startHour) * 60 + sessionStartTime.getMinutes();
        const startPercent = (startOffsetMinutes / (total * 60)) * 100;

        const durationMinutes = durationSeconds / 60;
        const durationPercent = (durationMinutes / (total * 60)) * 100;

        const elapsedMs = Math.max(0, now.getTime() - startTime);
        const totalDurationMs = durationSeconds * 1000;
        const progPercent = Math.min(100, (elapsedMs / totalDurationMs) * 100);

        const currentTimeOffsetMinutes = (now.getHours() - startHour) * 60 + now.getMinutes();
        const currentPercent = (currentTimeOffsetMinutes / (total * 60)) * 100;

        return {
            timelineStartHour: startHour,
            totalHours: total,
            sessionStartPercent: startPercent,
            sessionDurationPercent: durationPercent,
            progressPercent: progPercent,
            currentTimePercent: currentPercent,
        };
    }, [startTime, durationSeconds, now]);

    return (
         <div className="p-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                    <PomodoroIcon className="text-primary" />
                    <p className="font-semibold">Pomo</p>
                </div>
                <button className="p-1.5 rounded-full hover:bg-background-tertiary text-content-tertiary">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 10a2 2 0 11-4 0 2 2 0 014 0zM10 10a2 2 0 11-4 0 2 2 0 014 0zM15 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </button>
            </div>
            <div className="flex-grow flex flex-col space-y-4">
                <div className="relative" style={{ height: `${(totalHours + 1) * 2.5}rem` }}>
                    {Array.from({ length: totalHours + 2 }).map((_, i) => (
                        <div key={i} className="flex items-start h-10 text-xs text-content-tertiary">
                            <span className="w-6 -mt-2">{timelineStartHour + i}</span>
                            <div className="flex-1 border-t border-dashed border-border-primary/50 mt-0"></div>
                        </div>
                    ))}
                    <div className="absolute top-0 left-6 right-0 bottom-0">
                        <div className="absolute w-full bg-blue-500/10 border-l-2 border-blue-500" style={{ top: `${sessionStartPercent}%`, height: `${sessionDurationPercent}%` }}>
                            {/* The red line for current time will be here */}
                        </div>
                         <div className="absolute w-full h-px bg-red-500 z-10" style={{ top: `${currentTimePercent}%` }}>
                            <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                    </div>
                </div>
                <div className="flex-grow flex flex-col">
                    <h4 className="font-semibold mb-2">Focus Note</h4>
                    <textarea
                        value={note}
                        onChange={(e) => onNoteChange(e.target.value)}
                        placeholder="What do you have in mind?"
                        className="w-full flex-grow bg-background-primary border border-border-primary rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    ></textarea>
                </div>
            </div>
        </div>
    );
};

const EndSessionConfirmationModal: React.FC<{
    type: 'save' | 'quit' | null;
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
}> = ({ type, onSave, onDiscard, onCancel }) => {
    if (!type) return null;

    const isSaveType = type === 'save';

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
            <div className="bg-background-secondary rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-2 text-content-primary">
                    {isSaveType ? 'End Session' : 'Quit Session?'}
                </h2>
                <p className="text-sm text-content-secondary mb-4">
                    {isSaveType ? 'Do you want to save this focus session?' : 'The focus duration is less than 5 minutes and will not be recorded.'}
                </p>
                <div className="flex justify-end pt-4 space-x-3">
                    <button onClick={isSaveType ? onDiscard : onCancel} className="px-4 py-2 rounded-md bg-background-tertiary hover:bg-border-primary text-content-primary font-semibold transition-colors">
                        {isSaveType ? "Cancel" : "Cancel"}
                    </button>
                    <button onClick={isSaveType ? onSave : onDiscard} className={`px-4 py-2 rounded-md font-semibold transition-colors ${isSaveType ? 'bg-primary hover:bg-primary-focus text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                        {isSaveType ? 'Save' : 'Quit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CreatePomoModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onStart: (minutes: number) => void;
}> = ({ isOpen, onClose, onStart }) => {
    const [minutes, setMinutes] = useState('25');

    if (!isOpen) return null;

    const handleStart = () => {
        const duration = parseInt(minutes, 10);
        if (duration > 0) {
            onStart(duration);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background-secondary rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-4">Start New Session</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-content-secondary mb-1">Duration (minutes)</label>
                        <input
                            type="number"
                            value={minutes}
                            onChange={e => setMinutes(e.target.value)}
                            className="w-full bg-background-primary border border-border-primary rounded-md px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-content-secondary mb-2">Templates</label>
                        <div className="flex space-x-2">
                            {[25, 50, 90].map(duration => (
                                <button
                                    key={duration}
                                    type="button"
                                    onClick={() => setMinutes(String(duration))}
                                    className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${parseInt(minutes, 10) === duration ? 'bg-primary text-white' : 'bg-background-tertiary hover:bg-border-primary'}`}
                                >
                                    {duration} min
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end pt-6 space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-background-tertiary hover:bg-border-primary font-semibold">Cancel</button>
                    <button type="button" onClick={handleStart} className="px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary-focus">Start</button>
                </div>
            </div>
        </div>
    );
};


export const PomodoroPage: React.FC<PomodoroPageProps> = ({ sessions, onAddSession, tasks, habits }) => {
    const MIN_SAVE_DURATION_SECONDS = 5 * 60;
    
    const [mode, setMode] = useState<'pomo' | 'stopwatch'>('pomo');
    const [focusDuration, setFocusDuration] = useState(25 * 60);
    const [timeRemaining, setTimeRemaining] = useState(focusDuration);
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [selectedFocus, setSelectedFocus] = useState<{ id: string; name: string; type: 'task' | 'habit' } | null>(null);
    const [focusNote, setFocusNote] = useState('');
    const [isTaskSelectorOpen, setTaskSelectorOpen] = useState(false);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isCreatePomoModalOpen, setIsCreatePomoModalOpen] = useState(false);
    const [now, setNow] = useState(new Date());
    const [endConfirmationType, setEndConfirmationType] = useState<'save' | 'quit' | null>(null);
    const { playSound } = useSettings();

    const intervalRef = useRef<number | null>(null);
    
    const progress = isActive && focusDuration > 0 ? ((focusDuration - timeRemaining) / focusDuration) * 100 : 0;
    
    useEffect(() => {
        if (!isActive) {
            setTimeRemaining(focusDuration);
        }
    }, [focusDuration, isActive]);

    const stopTimer = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };
    
    const resetTimerState = () => {
        stopTimer();
        setIsActive(false);
        setIsPaused(false);
        setTimeRemaining(focusDuration);
        setStartTime(null);
        setFocusNote('');
    };

    const saveSession = () => {
        if (startTime) {
             onAddSession({
                startTime,
                endTime: Date.now(),
                taskName: selectedFocus?.name || (mode === 'pomo' ? 'Pomodoro' : 'Stopwatch'),
                taskId: selectedFocus?.id,
                note: focusNote,
            });
        }
    };
    
    const handleAutoEnd = () => {
        saveSession();
        playSound('completion');
        resetTimerState();
    };


    useEffect(() => {
        if (isActive && !isPaused) {
            intervalRef.current = window.setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        stopTimer();
                        handleAutoEnd();
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
        if (isActive) { // Update 'now' only when session is active
            const timerId = setInterval(() => setNow(new Date()), 1000);
            return () => clearInterval(timerId);
        }
    }, [isActive]);

    const handleStart = () => {
        if (selectedFocus || mode === 'stopwatch') {
            const now = Date.now();
            setStartTime(now);
            setIsActive(true);
            setIsPaused(false);
            playSound('reminder');
        } else {
            setTaskSelectorOpen(true);
        }
    };
    
    const handleStartCustomPomo = (minutes: number) => {
        const durationInSeconds = minutes * 60;
        setFocusDuration(durationInSeconds);
        setTimeRemaining(durationInSeconds); // Explicitly set time remaining as we are also starting the timer
    
        const now = Date.now();
        setStartTime(now);
        setIsActive(true);
        setIsPaused(false);
        playSound('reminder');
    };

    const handlePause = () => setIsPaused(true);
    const handleContinue = () => setIsPaused(false);
    
    const handleEndClick = () => {
        if (!startTime) return;
        handlePause();
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        if (elapsedSeconds < MIN_SAVE_DURATION_SECONDS) {
            setEndConfirmationType('quit');
        } else {
            setEndConfirmationType('save');
        }
    };

    const handleModalSave = () => {
        saveSession();
        playSound('completion');
        resetTimerState();
        setEndConfirmationType(null);
    };

    const handleModalDiscard = () => {
        playSound('reminder');
        resetTimerState();
        setEndConfirmationType(null);
    };

    const handleModalCancel = () => {
        handleContinue();
        setEndConfirmationType(null);
    };
    
    return (
        <>
        <div className="h-full flex text-content-primary">
            <ResizablePanel storageKey="pomodoro-overview-width" panelSide="right" initialWidth={400} minWidth={320} maxWidth={600}>
                {/* Right Panel */}
                 <div className={`h-full overflow-y-auto ${isActive ? 'bg-[#1C1C1E]' : 'bg-background-primary'}`}>
                    {isActive && startTime ? (
                        <ActiveFocusPanel startTime={startTime} durationSeconds={focusDuration} now={now} note={focusNote} onNoteChange={setFocusNote} />
                    ) : (
                        <div className="p-6">
                           <h2 className="text-lg font-bold mb-6">Overview</h2>
                           <FocusOverview sessions={sessions} onAddManual={() => setAddModalOpen(true)} />
                        </div>
                    )}
                </div>
                {/* Left Panel */}
                <div className="flex-1 flex flex-col h-full bg-background-primary">
                    <header className="p-6 flex-shrink-0 flex items-center justify-between relative">
                        <h1 className="text-2xl font-bold">Pomodoro</h1>

                        {!isActive && (
                            <div className="absolute left-1/2 -translate-x-1/2">
                                <div className="flex space-x-1 bg-background-secondary p-1 rounded-lg">
                                    <button onClick={() => setMode('pomo')} className={`px-3 py-1 text-sm font-semibold rounded-md ${mode === 'pomo' ? 'bg-primary text-white' : ''}`}>Pomo</button>
                                    <button onClick={() => setMode('stopwatch')} className={`px-3 py-1 text-sm font-semibold rounded-md ${mode === 'stopwatch' ? 'bg-primary text-white' : ''}`}>Stopwatch</button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            {!isActive && <button onClick={() => setIsCreatePomoModalOpen(true)} className="p-2 text-content-secondary rounded-lg hover:bg-background-tertiary"><PlusIcon /></button>}
                            <button className="p-2 text-content-secondary rounded-lg hover:bg-background-tertiary"><MoreIcon /></button>
                        </div>
                    </header>
                    <div className="flex-1 flex flex-col p-6 min-h-0">
                        <div className="text-center min-h-[3rem] mb-6">
                            <TaskSelectorPopover isOpen={isTaskSelectorOpen} onClose={() => setTaskSelectorOpen(false)} onSelect={setSelectedFocus} tasks={tasks} habits={habits}>
                                <button onClick={() => setTaskSelectorOpen(true)} className="text-lg text-content-secondary hover:text-content-primary transition-colors">
                                    {selectedFocus?.name || 'Focus'} &gt;
                                </button>
                            </TaskSelectorPopover>
                        </div>
                        
                        <div className="flex-1 flex items-center justify-center">
                            <div className="relative w-72 h-72 md:w-80 md:h-80">
                                <div className="md:hidden">
                                    <CircularProgress
                                        size={288}
                                        strokeWidth={10}
                                        progress={progress}
                                    />
                                </div>
                                <div className="hidden md:block">
                                    <CircularProgress
                                        size={320}
                                        strokeWidth={12}
                                        progress={progress}
                                    />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <h2 className="text-6xl font-mono text-content-primary">
                                            {isActive ? formatTime(timeRemaining) : formatTime(focusDuration)}
                                        </h2>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-shrink-0 flex items-center justify-center min-h-[10rem]">
                            {isActive ? (
                                isPaused ? (
                                    <div className="flex flex-col items-center space-y-4 w-full max-w-xs">
                                        <button onClick={handleContinue} className="w-full px-10 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-focus transition-colors">Continue</button>
                                        <button onClick={handleEndClick} className="w-full px-10 py-3 bg-transparent border-2 border-primary text-primary rounded-full font-semibold hover:bg-primary/10 transition-colors">End</button>
                                    </div>
                                ) : (
                                    <button onClick={handlePause} className="px-16 py-4 bg-transparent border-2 border-primary text-primary rounded-full font-semibold text-lg hover:bg-primary/10 transition-colors">Pause</button>
                                )
                            ) : (
                                <button onClick={handleStart} className="px-16 py-4 bg-primary text-white font-semibold text-lg hover:bg-primary-focus transition-colors rounded-lg">
                                    Start
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </ResizablePanel>
        </div>

        <AddFocusRecordModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} onAddSession={onAddSession} tasks={tasks} habits={habits} sessions={sessions} />
        <CreatePomoModal isOpen={isCreatePomoModalOpen} onClose={() => setIsCreatePomoModalOpen(false)} onStart={handleStartCustomPomo} />
        <EndSessionConfirmationModal
            type={endConfirmationType}
            onSave={handleModalSave}
            onDiscard={handleModalDiscard}
            onCancel={handleModalCancel}
        />
        </>
    );
};