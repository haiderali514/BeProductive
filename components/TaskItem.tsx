import React, { useState, useMemo } from 'react';
import { Task, Priority, Subtask, Recurrence } from '../types';
import { PRIORITY_COLORS, PRIORITY_BG_COLORS } from '../constants';
import { RecurrencePicker } from './RecurrencePicker';
import { MagicIcon, SubtaskIcon, WontDoIcon } from './Icons';
import { Settings } from '../hooks/useSettings';
import { Checkbox } from './Checkbox';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onToggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
  onDelete: (taskId: string) => void;
  onGenerateSubtasks: (taskId: string, taskTitle: string) => Promise<void>;
  onSetRecurrence: (taskId: string, recurrence: Recurrence | null) => void;
  onWontDo: (taskId: string) => void;
  onRestore: (taskId: string) => void;
  onPermanentDelete: (taskId: string) => void;
  aiEnabled: boolean;
  onSelect: (taskId: string) => void;
  isSelected: boolean;
  settings: Settings;
  onDragStart: () => void;
  onDrop: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  isDropTarget: boolean;
}

const RepeatIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`h-4 w-4 ${className}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.182-3.182m0-11.667a8.25 8.25 0 00-11.667 0L2.985 7.985" />
    </svg>
);


export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggleComplete, onToggleSubtaskComplete, onDelete, onGenerateSubtasks, onSetRecurrence, onWontDo, onRestore, onPermanentDelete, aiEnabled, onSelect, isSelected, settings, onDragStart, onDrop, onDragEnter, onDragEnd, isDropTarget }) => {
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
            day: 'numeric',
            timeZone: settings.timezone,
        };
        if (hasTime) {
            options.hour = 'numeric';
            options.minute = '2-digit';
        }

        return date.toLocaleString(undefined, options);
    }, [task.dueDate, settings.timezone]);

    const isStrikethrough = settings.completedTaskStyle === 'strikethrough';
    
    return (
        <div 
            draggable={!task.isSection && !task.trashed && !task.wontDo}
            onDragStart={onDragStart}
            onDrop={onDrop}
            onDragEnter={onDragEnter}
            onDragEnd={onDragEnd}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => onSelect(task.id)}
            className={`relative group p-3 rounded-lg transition-colors duration-200 border-l-4 ${PRIORITY_COLORS[task.priority]} ${isSelected ? 'bg-primary/10' : 'bg-background-secondary hover:bg-background-tertiary cursor-pointer'}`}>
            {isDropTarget && <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-full z-10" />}
            <div className="flex items-start">
                {task.wontDo ? (
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-content-tertiary">
                        <WontDoIcon className="h-4 w-4" />
                    </div>
                ) : (
                    <Checkbox disabled={task.trashed} checked={task.completed} onChange={(e) => { e.stopPropagation(); onToggleComplete(task.id); }} size="md" variant="round" />
                )}
                <div className="ml-3 flex-grow">
                    <p className={`text-content-primary ${task.completed ? `text-content-tertiary ${isStrikethrough ? 'line-through' : ''}` : ''} ${task.wontDo || task.trashed ? 'line-through text-content-tertiary' : ''}`}>{task.title}</p>
                    <div className="flex items-center space-x-3 mt-1 flex-wrap">
                        {formattedDueDate && <p className="text-sm text-green-500">{formattedDueDate}</p>}
                        {task.recurrence && (
                            <div className="flex items-center text-sm text-blue-400">
                                <RepeatIcon className="h-3 w-3 mr-1" />
                                <span>{task.recurrence}</span>
                            </div>
                        )}
                        {task.subtasks.length > 0 && (
                            <div className="flex items-center text-sm text-content-secondary">
                                <SubtaskIcon className="h-4 w-4 mr-1"/>
                                <span>{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}</span>
                            </div>
                        )}
                        {task.tags && task.tags.map(tag => (
                            <span key={tag} className="text-xs bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded">#{tag}</span>
                        ))}
                    </div>
                </div>
                <div onClick={(e) => e.stopPropagation()} className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.trashed ? (
                        <>
                            <button onClick={() => onRestore(task.id)} title="Restore" className="p-1.5 rounded-full hover:bg-background-primary text-content-secondary hover:text-green-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l4-4m-4 4l4 4" /></svg>
                            </button>
                            <button onClick={() => onPermanentDelete(task.id)} title="Delete permanently" className="p-1.5 rounded-full hover:bg-background-primary text-content-secondary hover:text-red-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </>
                    ) : task.wontDo ? (
                        <>
                           <button onClick={() => onRestore(task.id)} title="Mark as pending" className="p-1.5 rounded-full hover:bg-background-primary text-content-secondary hover:text-green-500">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l4-4m-4 4l4 4" /></svg>
                           </button>
                           <button onClick={() => onDelete(task.id)} aria-label="Move to trash" className="p-1.5 rounded-full hover:bg-background-primary text-content-secondary hover:text-red-500">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                        </>
                    ) : (
                        <>
                            {task.priority !== Priority.NONE && <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${PRIORITY_BG_COLORS[task.priority]}`}>{task.priority}</span>}
                            <div className="relative">
                                <button onClick={() => setShowRecurrencePicker(!showRecurrencePicker)} aria-label="Set recurrence" className="p-1.5 rounded-full hover:bg-background-primary text-content-secondary hover:text-primary">
                                    <RepeatIcon />
                                </button>
                                {showRecurrencePicker && <RecurrencePicker onSetRecurrence={handleSetRecurrence} onClose={() => setShowRecurrencePicker(false)} />}
                            </div>
                            <button
                                onClick={handleGenerateSubtasks}
                                disabled={isGenerating || !aiEnabled}
                                aria-label="Generate subtasks"
                                title={!aiEnabled ? "AI features are disabled in settings" : "Generate subtasks"}
                                className="p-1.5 rounded-full hover:bg-background-primary text-content-secondary hover:text-primary disabled:cursor-not-allowed disabled:text-content-tertiary"
                            >
                                {isGenerating ? 
                                    <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 
                                    : <MagicIcon className="h-4 w-4" /> 
                                }
                            </button>
                             <button onClick={() => onWontDo(task.id)} title="Won't Do" className="p-1.5 rounded-full hover:bg-background-primary text-content-secondary hover:text-yellow-500">
                                <WontDoIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => onDelete(task.id)} aria-label="Delete task" className="p-1.5 rounded-full hover:bg-background-primary text-content-secondary hover:text-red-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </>
                    )}
                </div>
            </div>
            {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
        </div>
    );
};