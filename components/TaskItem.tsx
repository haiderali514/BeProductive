import React, { useState, useMemo } from 'react';
import { Task, Priority, Subtask, Recurrence } from '../types';
import { PRIORITY_COLORS, PRIORITY_BG_COLORS } from '../constants';
import { RecurrencePicker } from './RecurrencePicker';
import { MagicIcon } from './Icons';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onToggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
  onDelete: (taskId: string) => void;
  onGenerateSubtasks: (taskId: string, taskTitle: string) => Promise<void>;
  onSetRecurrence: (taskId: string, recurrence: Recurrence | null) => void;
}

const Checkbox: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <div onClick={onChange} className={`cursor-pointer w-5 h-5 border-2 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${checked ? 'bg-primary border-primary' : 'border-content-tertiary hover:border-primary'}`}>
        {checked && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
    </div>
);

const RepeatIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`h-4 w-4 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.182-3.182m0-11.667a8.25 8.25 0 00-11.667 0L2.985 7.985" />
    </svg>
);


export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggleComplete, onToggleSubtaskComplete, onDelete, onGenerateSubtasks, onSetRecurrence }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
    
    const handleGenerateSubtasks = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            await onGenerateSubtasks(task.id, task.title);
        } catch (e: any) {
            setError(e.message || "Failed to generate subtasks.");
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSetRecurrence = (recurrence: Recurrence | null) => {
        onSetRecurrence(task.id, recurrence);
    };

    const formattedDueDate = useMemo(() => {
        if (!task.dueDate) return null;
        // Robustly parse both "YYYY-MM-DD" and "YYYY-MM-DD HH:MM" formats
        const date = new Date(task.dueDate.replace(' ', 'T'));
        if (isNaN(date.getTime())) {
            return null;
        }

        const hasTime = task.dueDate.includes(':');
        const options: Intl.DateTimeFormatOptions = { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        };
        if (hasTime) {
            options.hour = 'numeric';
            options.minute = '2-digit';
        }

        return date.toLocaleString(undefined, options);
    }, [task.dueDate]);
    
    return (
        <div className={`group bg-background-secondary p-3 rounded-lg hover:bg-background-tertiary transition-colors duration-200 border-l-4 ${PRIORITY_COLORS[task.priority]}`}>
            <div className="flex items-start">
                <Checkbox checked={task.completed} onChange={() => onToggleComplete(task.id)} />
                <div className="ml-3 flex-grow">
                    <p className={`text-content-primary ${task.completed ? 'line-through text-content-tertiary' : ''}`}>{task.title}</p>
                    <div className="flex items-center space-x-3 mt-1">
                        {formattedDueDate && <p className="text-sm text-green-500">{formattedDueDate}</p>}
                        {task.recurrence && (
                            <div className="flex items-center text-sm text-blue-400">
                                <RepeatIcon className="h-3 w-3 mr-1" />
                                <span>{task.recurrence}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.priority !== Priority.NONE && <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${PRIORITY_BG_COLORS[task.priority]}`}>{task.priority}</span>}
                     <div className="relative">
                        <button onClick={() => setShowRecurrencePicker(!showRecurrencePicker)} aria-label="Set recurrence" className="p-1.5 rounded-full hover:bg-background-primary text-content-secondary hover:text-primary">
                            <RepeatIcon />
                        </button>
                        {showRecurrencePicker && <RecurrencePicker onSetRecurrence={handleSetRecurrence} onClose={() => setShowRecurrencePicker(false)} />}
                    </div>
                    <button onClick={handleGenerateSubtasks} disabled={isGenerating} aria-label="Generate subtasks" className="p-1.5 rounded-full hover:bg-background-primary text-content-secondary hover:text-primary disabled:cursor-not-allowed">
                        {isGenerating ? 
                            <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 
                            : /* FIX: Add className to size the icon correctly. */ <MagicIcon className="h-4 w-4" /> 
                        }
                    </button>
                    <button onClick={() => onDelete(task.id)} aria-label="Delete task" className="p-1.5 rounded-full hover:bg-background-primary text-content-secondary hover:text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>
            {task.subtasks.length > 0 && (
                 <div className="mt-3 pl-8 space-y-2">
                    {task.subtasks.map(subtask => (
                        <div key={subtask.id} className="flex items-center">
                            <Checkbox checked={subtask.completed} onChange={() => onToggleSubtaskComplete(task.id, subtask.id)} />
                            <p className={`ml-3 text-sm flex-grow ${subtask.completed ? 'line-through text-content-tertiary' : 'text-content-secondary'}`}>{subtask.title}</p>
                        </div>
                    ))}
                </div>
            )}
            {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
        </div>
    );
};