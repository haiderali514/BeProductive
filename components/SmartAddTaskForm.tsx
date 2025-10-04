import React, { useState } from 'react';
import { parseTaskFromString } from '../services/geminiService';
import { List, Priority, Recurrence } from '../types';
import { MagicIcon } from './Icons';

interface SmartAddTaskFormProps {
  lists: List[];
  onAddTask: (task: { title: string; listId: string; priority: Priority; dueDate: string | null; recurrence: Recurrence | null; }) => void;
}

export const SmartAddTaskForm: React.FC<SmartAddTaskFormProps> = ({ lists, onAddTask }) => {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const listNames = lists.map(l => l.name);
            const parsedTask = await parseTaskFromString(inputValue, listNames);
            const targetList = lists.find(l => l.name.toLowerCase() === parsedTask.listName.toLowerCase()) || lists[0];
            
            onAddTask({
                ...parsedTask,
                listId: targetList.id
            });
            setInputValue('');

        } catch (e: any) {
            setError(e.message || "Failed to add task.");
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 bg-background-secondary/50 border-t border-border-primary">
            <form onSubmit={handleSubmit} className="relative">
                <div className="absolute left-3 inset-y-0 flex items-center">
                    <MagicIcon className="text-primary" />
                </div>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isLoading}
                    placeholder="e.g., Pay rent monthly #personal !high"
                    className="w-full pl-10 pr-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-shadow text-content-primary placeholder-content-tertiary"
                />
                {isLoading && (
                    <div className="absolute right-3 inset-y-0 flex items-center">
                        <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
            </form>
            {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
        </div>
    );
};