import React, { useState } from 'react';
import { Task, Habit, PomodoroSession } from '../types';
import { DateTimePicker } from './DateTimePicker';

interface AddFocusRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddSession: (session: Omit<PomodoroSession, 'id'>) => void;
    tasks: Task[];
    habits: Habit[];
}

export const AddFocusRecordModal: React.FC<AddFocusRecordModalProps> = ({ isOpen, onClose, onAddSession, tasks, habits }) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [taskId, setTaskId] = useState<string>('');
    const [startTime, setStartTime] = useState<Date>(oneHourAgo);
    const [endTime, setEndTime] = useState<Date>(now);
    const [note, setNote] = useState('');
    
    if (!isOpen) return null;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedTask = [...tasks, ...habits].find(t => t.id === taskId);
        if (endTime <= startTime) {
            alert("End time must be after start time.");
            return;
        }

        onAddSession({
            startTime: startTime.getTime(),
            endTime: endTime.getTime(),
            // Fix: Use a type guard ('in' operator) to safely access properties on the 'Task | Habit' union type.
            taskName: selectedTask ? ('title' in selectedTask ? selectedTask.title : selectedTask.name) : 'Unlinked Session',
            taskId: taskId || undefined,
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
                            <option value="">Set Task</option>
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
                    
                    <div className="flex justify-end pt-4 space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-background-tertiary hover:bg-border-primary text-content-primary font-semibold transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-primary hover:bg-primary-focus text-white font-semibold transition-colors">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};