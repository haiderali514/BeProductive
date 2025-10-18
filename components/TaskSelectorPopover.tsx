import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Task, Habit } from '../types';

interface TaskSelectorPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (selection: { id: string; name: string; type: 'task' | 'habit' }) => void;
    tasks: Task[];
    habits: Habit[];
    children: React.ReactNode;
}

export const TaskSelectorPopover: React.FC<TaskSelectorPopoverProps> = ({ isOpen, onClose, onSelect, tasks, habits, children }) => {
    const [activeTab, setActiveTab] = useState<'Task' | 'Habit'>('Task');
    const [searchTerm, setSearchTerm] = useState('');
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);


    const filteredTasks = useMemo(() => {
        return tasks.filter(task => 
            !task.completed &&
            task.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tasks, searchTerm]);

    const filteredHabits = useMemo(() => {
        return habits.filter(habit => 
            habit.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [habits, searchTerm]);
    
    const handleSelect = (item: { id: string; name: string; type: 'task' | 'habit' }) => {
        onSelect(item);
        onClose();
    };

    if (!isOpen) return <>{children}</>;

    return (
        <div className="relative">
            {children}
            <div ref={popoverRef} className="absolute z-10 top-full mt-2 w-80 bg-background-secondary rounded-lg shadow-2xl border border-border-primary overflow-hidden">
                <div className="p-2">
                    <div className="flex bg-background-tertiary rounded-md p-1 mb-2">
                        <button onClick={() => setActiveTab('Task')} className={`flex-1 text-sm py-1 rounded ${activeTab === 'Task' ? 'bg-primary text-white' : 'text-content-secondary'}`}>Task</button>
                        <button onClick={() => setActiveTab('Habit')} className={`flex-1 text-sm py-1 rounded ${activeTab === 'Habit' ? 'bg-primary text-white' : 'text-content-secondary'}`}>Habit</button>
                    </div>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-background-primary border border-border-primary rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
                <div className="max-h-60 overflow-y-auto">
                    {activeTab === 'Task' && (
                         <ul className="px-2 pb-2">
                            {filteredTasks.length > 0 ? filteredTasks.map(task => (
                                <li key={task.id} onClick={() => handleSelect({ id: task.id, name: task.title, type: 'task' })} className="p-2 rounded cursor-pointer hover:bg-background-tertiary flex justify-between items-center">
                                    <span className="truncate">{task.title}</span>
                                    {task.dueDate && <span className="text-xs text-red-400 flex-shrink-0 ml-2">{new Date(task.dueDate.split(' ')[0] + 'T00:00:00').toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>}
                                </li>
                            )) : <li className="p-2 text-center text-sm text-content-tertiary">No tasks found.</li>}
                        </ul>
                    )}
                     {activeTab === 'Habit' && (
                        <ul className="px-2 pb-2">
                            {filteredHabits.length > 0 ? filteredHabits.map(habit => (
                                <li key={habit.id} onClick={() => handleSelect({ id: habit.id, name: habit.name, type: 'habit' })} className="p-2 rounded cursor-pointer hover:bg-background-tertiary">
                                    <span className="mr-2">{habit.icon}</span>
                                    <span>{habit.name}</span>
                                </li>
                            )) : <li className="p-2 text-center text-sm text-content-tertiary">No habits found.</li>}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};