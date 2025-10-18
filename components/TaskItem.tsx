import React, { useState, useMemo } from 'react';
import { Task, Priority, Subtask, Recurrence, Tag } from '../types';
import { PRIORITY_COLORS } from '../constants';
import { CommentIcon, CalendarIcon, FlagIcon, MatrixIcon, PomodoroIcon, HabitIcon, TimelineIcon, AttachmentIcon } from './Icons';
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
  onDrop: (e: React.DragEvent) => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  isDropTarget: boolean;
  allTags: Tag[];
  showDetails: boolean;
  isDragDisabled?: boolean;
  containerClassName?: string;
}

const TaskIcon: React.FC<{ icon: string }> = ({ icon }) => {
    const iconClass = "w-4 h-4 mr-2 text-content-secondary flex-shrink-0";
    switch (icon) {
        case 'calendar': return <CalendarIcon className={iconClass} />;
        case 'matrix': return <MatrixIcon className={iconClass} />;
        case 'pomodoro': return <PomodoroIcon className={iconClass} />;
        case 'habit': return <HabitIcon className={iconClass} />;
        case 'kanban': return <TimelineIcon className={iconClass} />;
        case 'subscription': return <AttachmentIcon className={iconClass} />;
        default: return null;
    }
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggleComplete, onToggleSubtaskComplete, onDelete, onGenerateSubtasks, onSetRecurrence, onWontDo, onRestore, onPermanentDelete, aiEnabled, onSelect, isSelected, settings, onDragStart, onDrop, onDragEnter, onDragEnd, isDropTarget, allTags, showDetails, isDragDisabled = false, containerClassName }) => {
    const isStrikethrough = settings.completedTaskStyle === 'strikethrough';
    
     const formattedDueDate = useMemo(() => {
        if (!task.dueDate) return null;
        try {
            const date = new Date(task.dueDate.replace(' ', 'T'));
            if (isNaN(date.getTime())) {
                // If date is not parsable (e.g., "tomorrow"), show the raw string
                return task.dueDate;
            }
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric'});
        } catch(e) {
            return null;
        }
    }, [task.dueDate]);

    return (
        <div 
            draggable={!isDragDisabled && !task.isSection && !task.trashed && !task.wontDo}
            onDragStart={onDragStart}
            onDrop={isDragDisabled ? undefined : onDrop}
            onDragEnter={isDragDisabled ? undefined : onDragEnter}
            onDragEnd={onDragEnd}
            onDragOver={isDragDisabled ? undefined : (e) => e.preventDefault()}
            onClick={() => onSelect(task.id)}
            className={`relative group p-3 rounded-lg transition-colors duration-200 ${isSelected ? 'bg-primary/10' : 'bg-transparent hover:bg-background-secondary cursor-pointer'} ${containerClassName || ''}`}>
            {isDropTarget && <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-full z-10" />}
            <div className="flex items-start">
                <div className="pt-0.5">
                    <Checkbox disabled={task.trashed || task.wontDo} checked={task.completed} onChange={(e) => { e.stopPropagation(); onToggleComplete(task.id); }} size="md" variant="square" priority={task.priority} />
                </div>
                <div className="ml-3 flex-grow min-w-0">
                    <div className={`text-content-primary flex items-center ${task.completed ? `text-content-tertiary ${isStrikethrough ? 'line-through' : ''}` : ''} ${task.wontDo || task.trashed ? 'line-through text-content-tertiary' : ''}`}>
                        {task.icon && <TaskIcon icon={task.icon} />}
                        <span>{task.title}</span>
                    </div>
                    
                    {showDetails && (
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-content-secondary mt-1.5">
                            {formattedDueDate && (
                                <span className="flex items-center">
                                    <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                                    {formattedDueDate}
                                </span>
                            )}
                             {task.priority !== Priority.NONE && (
                                <span className="flex items-center">
                                    <FlagIcon className="w-3.5 h-3.5 mr-1" />
                                    {task.priority}
                                </span>
                            )}
                            {task.tags?.map(tagId => {
                                const tag = allTags.find(t => t.id === tagId);
                                if (!tag) return null;
                                return (
                                    <span 
                                        key={tag.id} 
                                        className="text-xs font-semibold px-2 py-0.5 rounded"
                                        style={{ backgroundColor: `${tag.color}4D`, color: tag.color }}
                                    >
                                        {tag.name}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div onClick={(e) => e.stopPropagation()} className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                     <button onClick={() => onSelect(task.id)} title="Details" className="p-1.5 rounded-full hover:bg-background-primary text-content-secondary hover:text-primary">
                        <CommentIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};