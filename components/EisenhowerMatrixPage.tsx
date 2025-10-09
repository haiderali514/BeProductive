import React, { useMemo } from 'react';
import { Task, Priority } from '../types';

// A simplified task card for the matrix view
const MatrixTaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const formattedDueDate = useMemo(() => {
        if (!task.dueDate) return null;
        const date = new Date(task.dueDate.replace(' ', 'T'));
        if (isNaN(date.getTime())) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const taskDay = new Date(date);
        taskDay.setHours(0, 0, 0, 0);

        if (taskDay.getTime() === today.getTime()) return 'Today';
        if (taskDay.getTime() === tomorrow.getTime()) return 'Tomorrow';

        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }, [task.dueDate]);

    const priorityColors: Record<Priority, string> = {
        [Priority.HIGH]: 'bg-red-500/20 text-red-400',
        [Priority.MEDIUM]: 'bg-yellow-500/20 text-yellow-400',
        [Priority.LOW]: 'bg-blue-500/20 text-blue-400',
        [Priority.NONE]: 'hidden',
    };

    return (
        <div className="bg-background-tertiary p-3 rounded-md mb-2 shadow-sm border-l-2 border-transparent hover:border-primary transition-colors">
            <p className="text-content-primary text-sm">{task.title}</p>
            <div className="flex items-center space-x-2 mt-1">
                {formattedDueDate && <p className="text-xs text-green-500">{formattedDueDate}</p>}
                {task.priority !== Priority.NONE && (
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${priorityColors[task.priority]}`}>{task.priority}</span>
                )}
            </div>
        </div>
    );
};

// Quadrant component for displaying a category of tasks
const MatrixQuadrant: React.FC<{ title: string; description: string; tasks: Task[]; className?: string }> = ({ title, description, tasks, className = '' }) => (
    <div className={`bg-background-secondary p-4 rounded-lg flex flex-col ${className}`}>
        <div className="flex-shrink-0">
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-xs text-content-tertiary mb-4">{description}</p>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 -mr-2">
            {tasks.length > 0 ? (
                tasks.map(task => <MatrixTaskCard key={task.id} task={task} />)
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-content-tertiary italic">No tasks here</p>
                </div>
            )}
        </div>
    </div>
);

interface EisenhowerMatrixPageProps {
    tasks: Task[];
}

export const EisenhowerMatrixPage: React.FC<EisenhowerMatrixPageProps> = ({ tasks }) => {
    const categorizedTasks = useMemo(() => {
        const incompleteTasks = tasks.filter(t => !t.completed && !t.wontDo && !t.trashed);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const isUrgent = (task: Task): boolean => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate.replace(' ', 'T'));
            if (isNaN(taskDate.getTime())) return false;
            taskDate.setHours(0,0,0,0); // Normalize to date part for comparison
            return taskDate.getTime() === today.getTime() || taskDate.getTime() === tomorrow.getTime();
        };

        const isImportant = (task: Task): boolean => {
            return task.priority === Priority.HIGH || task.priority === Priority.MEDIUM;
        };

        const doTasks: Task[] = [];
        const scheduleTasks: Task[] = [];
        const delegateTasks: Task[] = [];
        const deleteTasks: Task[] = [];

        incompleteTasks.forEach(task => {
            const urgent = isUrgent(task);
            const important = isImportant(task);

            if (urgent && important) doTasks.push(task);
            else if (!urgent && important) scheduleTasks.push(task);
            else if (urgent && !important) delegateTasks.push(task);
            else deleteTasks.push(task);
        });

        return { doTasks, scheduleTasks, delegateTasks, deleteTasks };
    }, [tasks]);

    return (
        <div className="p-6 flex-1 flex flex-col h-full overflow-hidden">
            <h1 className="text-3xl font-bold text-content-primary mb-1 flex-shrink-0">Eisenhower Matrix</h1>
            <p className="text-content-secondary mb-6 flex-shrink-0">Prioritize your tasks based on urgency and importance.</p>
            
            <div className="grid grid-cols-2 grid-rows-2 gap-4 flex-1 min-h-0">
                <MatrixQuadrant 
                    title="Do" 
                    description="Urgent & Important" 
                    tasks={categorizedTasks.doTasks} 
                    className="border-t-4 border-red-500"
                />
                <MatrixQuadrant 
                    title="Schedule" 
                    description="Important, Not Urgent" 
                    tasks={categorizedTasks.scheduleTasks} 
                    className="border-t-4 border-blue-500"
                />
                <MatrixQuadrant 
                    title="Delegate" 
                    description="Urgent, Not Important" 
                    tasks={categorizedTasks.delegateTasks} 
                    className="border-t-4 border-yellow-500"
                />
                <MatrixQuadrant 
                    title="Delete" 
                    description="Not Urgent, Not Important" 
                    tasks={categorizedTasks.deleteTasks} 
                    className="border-t-4 border-gray-500"
                />
            </div>
        </div>
    );
};