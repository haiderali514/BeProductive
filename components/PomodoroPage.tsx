
import React, { useState, useEffect, useMemo } from 'react';
import { PomodoroSession } from '../types';

interface PomodoroPageProps {
    sessions: PomodoroSession[];
    onAddSession: (session: Omit<PomodoroSession, 'id'>) => void;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const Timer: React.FC<{onAddSession: PomodoroPageProps['onAddSession']}> = ({ onAddSession }) => {
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
                        onAddSession({ startTime: startTime!, endTime: Date.now(), taskName: 'Vibe Coding' });
                        return FOCUS_DURATION;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, startTime, onAddSession]);

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
                {Object.entries(groupedSessions).map(([date, dateSessions]) => (
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
                ))}
            </div>
        </div>
    );
}

export const PomodoroPage: React.FC<PomodoroPageProps> = ({ sessions, onAddSession }) => {
    return (
        <div className="flex flex-1">
            <div className="flex-1">
                <Timer onAddSession={onAddSession} />
            </div>
            <FocusOverview sessions={sessions} />
        </div>
    );
};
