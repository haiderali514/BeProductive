
import React from 'react';
import { Task } from '../types';
import { useData } from '../contexts/DataContext';

interface TimelineViewProps {
  tasks: Task[];
  onSelectTask: (taskId: string, triggerRef: React.RefObject<HTMLElement>) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

const toYYYYMMDD = (date: Date): string => date.toISOString().split('T')[0];

const TimelineTaskCard: React.FC<{ task: Task, onSelect: () => void, isDraggable: boolean, onDragStart: (e: React.DragEvent) => void }> = ({ task, onSelect, isDraggable, onDragStart }) => (
    <div
        onClick={onSelect}
        draggable={isDraggable}
        onDragStart={onDragStart}
        className="w-full text-left bg-background-tertiary p-2 rounded-md text-sm hover:bg-background-primary transition-colors cursor-pointer"
    >
        <p className="font-semibold truncate">{task.title}</p>
    </div>
);

export const TimelineView: React.FC<TimelineViewProps> = ({ tasks, onSelectTask, onUpdateTask }) => {
    const { unscheduledTasks, dateRange, tasksByDate } = React.useMemo(() => {
        const tasksByDate: Record<string, Task[]> = {};
        const unscheduledTasks: Task[] = [];
        
        let minDate: Date | null = null;
        let maxDate: Date | null = null;

        tasks.forEach(task => {
             if(task.isSection) return;

            if (task.dueDate) {
                try {
                    const dateStr = task.dueDate.split(' ')[0];
                    if (!tasksByDate[dateStr]) tasksByDate[dateStr] = [];
                    tasksByDate[dateStr].push(task);
                    
                    const taskDate = new Date(dateStr);
                    if (!minDate || taskDate < minDate) minDate = taskDate;
                    if (!maxDate || taskDate > maxDate) maxDate = taskDate;
                } catch(e) {
                     unscheduledTasks.push(task);
                }
            } else {
                unscheduledTasks.push(task);
            }
        });
        
        const start = new Date();
        start.setDate(start.getDate() - 7);
        if (minDate && minDate < start) start.setTime(minDate.getTime());
        
        const end = new Date();
        end.setDate(end.getDate() + 30);
        if (maxDate && maxDate > end) end.setTime(maxDate.getTime());
        
        const dateRange: Date[] = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dateRange.push(new Date(d));
        }

        return { tasksByDate, unscheduledTasks, dateRange };
    }, [tasks]);

    const todayStr = toYYYYMMDD(new Date());

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    const handleDrop = (e: React.DragEvent, date: Date) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        if(taskId) {
            onUpdateTask(taskId, { dueDate: toYYYYMMDD(date) });
        }
    };
    
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    return (
        <div className="flex h-full overflow-x-auto space-x-3 p-4">
            <div className="w-72 flex-shrink-0 bg-background-secondary rounded-lg flex flex-col h-full max-h-full">
                <h3 className="font-semibold p-3 border-b border-border-primary flex-shrink-0">Unscheduled</h3>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {unscheduledTasks.map(task => {
                        const taskRef = React.createRef<HTMLDivElement>();
                        return (
                             <div ref={taskRef} key={task.id}>
                                <TimelineTaskCard
                                    task={task}
                                    onSelect={() => onSelectTask(task.id, taskRef)}
                                    isDraggable={true}
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
            {dateRange.map(date => {
                const dateStr = toYYYYMMDD(date);
                const dayTasks = tasksByDate[dateStr] || [];
                const isToday = dateStr === todayStr;

                return (
                    <div 
                        key={dateStr} 
                        className={`w-72 flex-shrink-0 rounded-lg flex flex-col h-full max-h-full ${isToday ? 'bg-primary/5' : 'bg-background-secondary'}`}
                        onDrop={(e) => handleDrop(e, date)}
                        onDragOver={handleDragOver}
                    >
                        <div className={`p-3 border-b ${isToday ? 'border-primary/20' : 'border-border-primary'} flex-shrink-0`}>
                            <p className={`font-semibold text-sm ${isToday ? 'text-primary' : ''}`}>
                                {date.toLocaleDateString(undefined, { weekday: 'short' })}
                            </p>
                            <p className="text-2xl font-bold">
                                {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {dayTasks.map(task => {
                                 const taskRef = React.createRef<HTMLDivElement>();
                                 return (
                                    <div ref={taskRef} key={task.id}>
                                        <TimelineTaskCard 
                                            task={task} 
                                            onSelect={() => onSelectTask(task.id, taskRef)} 
                                            isDraggable={false}
                                            onDragStart={() => {}}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
