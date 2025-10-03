
import React, { useState } from 'react';
import { parseTaskFromString } from '../services/geminiService';
import { List, Priority } from '../types';

interface SmartAddTaskFormProps {
  lists: List[];
  onAddTask: (task: { title: string; listId: string; priority: Priority; dueDate: string | null; }) => void;
}

const MagicIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2l4.588.453a1 1 0 01.527 1.745l-3.26 3.4.963 4.753a1 1 0 01-1.482 1.054L12 15.547l-4.478 2.658a1 1 0 01-1.482-1.054l.963-4.753-3.26-3.4a1 1 0 01.527-1.745l4.588-.453L11.033 2.744A1 1 0 0112 2z" clipRule="evenodd" />
    </svg>
);

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
                    placeholder="e.g., Dinner with Mom next Friday 7pm #personal !medium"
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
