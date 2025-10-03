
import React, { useState } from 'react';
import { Task, Priority, Subtask } from '../types';
import { PRIORITY_COLORS, PRIORITY_BG_COLORS } from '../constants';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onToggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
  onDelete: (taskId: string) => void;
  onGenerateSubtasks: (taskId: string, taskTitle: string) => Promise<void>;
}

const Checkbox: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <div onClick={onChange} className={`cursor-pointer w-5 h-5 border-2 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${checked ? 'bg-primary border-primary' : 'border-content-tertiary hover:border-primary'}`}>
        {checked && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
    </div>
);

const MagicIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2l4.588.453a1 1 0 01.527 1.745l-3.26 3.4.963 4.753a1 1 0 01-1.482 1.054L12 15.547l-4.478 2.658a1 1 0 01-1.482-1.054l.963-4.753-3.26-3.4a1 1 0 01.527-1.745l4.588-.453L11.033 2.744A1 1 0 0112 2z" clipRule="evenodd" />
    </svg>
);


export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggleComplete, onToggleSubtaskComplete, onDelete, onGenerateSubtasks }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
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
    
    return (
        <div className={`group bg-background-secondary p-3 rounded-lg hover:bg-background-tertiary transition-colors duration-200 border-l-4 ${PRIORITY_COLORS[task.priority]}`}>
            <div className="flex items-start">
                <Checkbox checked={task.completed} onChange={() => onToggleComplete(task.id)} />
                <div className="ml-3 flex-grow">
                    <p className={`text-content-primary ${task.completed ? 'line-through text-content-tertiary' : ''}`}>{task.title}</p>
                    {task.dueDate && <p className="text-sm text-green-500 mt-1">{new Date(task.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>}
                </div>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.priority !== Priority.NONE && <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${PRIORITY_BG_COLORS[task.priority]}`}>{task.priority}</span>}
                    <button onClick={handleGenerateSubtasks} disabled={isGenerating} className="p-1.5 rounded-full hover:bg-background-primary text-content-secondary hover:text-primary disabled:cursor-not-allowed">
                        {isGenerating ? 
                            <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 
                            : <MagicIcon /> 
                        }
                    </button>
                    <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-full hover:bg-background-primary text-content-secondary hover:text-red-500">
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
