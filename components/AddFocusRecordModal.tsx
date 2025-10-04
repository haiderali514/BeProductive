

import React, { useState, useEffect } from 'react';
import { Task, Habit, PomodoroSession } from '../types';
import { DateTimePicker } from './DateTimePicker';

interface AddFocusRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddSession: (session: Omit<PomodoroSession, 'id'>) => void;
    tasks: Task[];
    habits: Habit[];
    sessions: PomodoroSession[];
}

export const AddFocusRecordModal: React.FC<AddFocusRecordModalProps> = ({ isOpen, onClose, onAddSession, tasks, habits, sessions }) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [taskId, setTaskId] = useState<string>('');
    const [startTime, setStartTime] = useState<Date>(oneHourAgo);
    const [endTime, setEndTime] = useState<Date>(now);
    const [note, setNote] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSaveDisabled, setIsSaveDisabled] = useState(true);
    
    // Live validation with useEffect to control button state and error messages
    useEffect(() => {
        if (!isOpen) return;

        const checkValidity = () => {
            // Rule 1: Cannot be in the future
            const now = new Date();
            if (startTime > now || endTime > now) {
                setError("Focus session cannot be in the future.");
                return true; // Disabled
            }
            
            // Rule 2: End time must be after start time
            if (endTime <= startTime) {
                setError("End time must be after start time.");
                return true; // Disabled
            }

            // Rule 3: No overlap with existing sessions
            const newStartTime = startTime.getTime();
            const newEndTime = endTime.getTime();

            const hasOverlap = sessions.some(existingSession => {
                const existingStart = existingSession.startTime;
                const existingEnd = existingSession.endTime;
                // Check for overlap: (StartA < EndB) and (EndA > StartB)
                return newStartTime < existingEnd && newEndTime > existingStart;
            });

            if (hasOverlap) {
                setError("The selected time conflicts with an existing focus session.");
                return true; // Disabled
            }
            
            // Rule 4: Must have a task linked. If other checks passed, clear error.
            if (!taskId) {
                setError(null);
                return true; // Disabled
            }

            setError(null); // All checks passed
            return false; // Not disabled (enabled)
        };

        setIsSaveDisabled(checkValidity());

    }, [isOpen, taskId, startTime, endTime, sessions]);

    if (!isOpen) return null;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSaveDisabled) {
            if (!taskId) setError("Please link a task or habit to this focus session.");
            return;
        }
        
        const selectedTask = [...tasks, ...habits].find(t => t.id === taskId);
        
        if (!selectedTask) {
             setError("Selected task or habit not found. Please select another one.");
             return;
        }

        onAddSession({
            startTime: startTime.getTime(),
            endTime: endTime.getTime(),
            taskName: ('title' in selectedTask ? selectedTask.title : selectedTask.name),
            taskId: taskId,
            note: note,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background-secondary rounded-lg shadow-xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 text-content-primary">Add Focus Record</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-content-secondary mb-1">Task</label>
                        <select
                            value={taskId}
                            onChange={e => setTaskId(e.target.value)}
                            className="w-full bg-background-primary border border-border-primary rounded-md px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">-- Select a Task or Habit --</option>
                            <optgroup label="Tasks">
                                {tasks.filter(t => !t.completed).map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
                            </optgroup>
                             <optgroup label="Habits">
                                {habits.map(habit => <option key={habit.id} value={habit.id}>{habit.icon} {habit.name}</option>)}
                            </optgroup>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-content-secondary mb-1">Start</label>
                            <DateTimePicker value={startTime} onChange={setStartTime} />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-content-secondary mb-1">End</label>
                            <DateTimePicker value={endTime} onChange={setEndTime} />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-content-secondary mb-1">Focus Note</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="What did you work on?"
                            rows={3}
                            className="w-full bg-background-primary border border-border-primary rounded-md px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        ></textarea>
                    </div>
                    
                    {error && <p className="text-red-500 text-center text-sm">{error}</p>}

                    <div className="flex justify-end pt-4 space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-background-tertiary hover:bg-border-primary text-content-primary font-semibold transition-colors">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={isSaveDisabled}
                            className="px-4 py-2 rounded-md bg-primary hover:bg-primary-focus text-white font-semibold transition-colors disabled:bg-background-tertiary disabled:text-content-secondary disabled:cursor-not-allowed"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};