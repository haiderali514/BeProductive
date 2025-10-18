import React from 'react';
import { Task, List, PomodoroSession } from '../types';
import { Popover } from './Popover';
import { TaskDetailPanel } from './TaskDetailPanel';

interface TaskDetailPopoverProps {
    task: Task | null;
    triggerRef: React.RefObject<HTMLElement | null>;
    onClose: () => void;
    lists: List[];
    tasks: Task[];
    pomodoroSessions: PomodoroSession[];
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    onDeleteTask: (taskId: string) => void;
    onAddSubtask: (taskId: string, subtaskTitle: string) => void;
    onToggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
    onReorderTask: (draggedTaskId: string, targetId: string) => void;
}

export const TaskDetailPopover: React.FC<TaskDetailPopoverProps> = (props) => {
    if (!props.task || !props.triggerRef.current) {
        return null;
    }

    return (
        <Popover isOpen={true} onClose={props.onClose} triggerRef={props.triggerRef} position="right-start">
            <div className="w-[500px] h-[70vh] bg-background-secondary rounded-lg shadow-2xl border border-border-primary overflow-hidden">
                <TaskDetailPanel {...props} task={props.task} />
            </div>
        </Popover>
    );
};