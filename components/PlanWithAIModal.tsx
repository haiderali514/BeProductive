import React, { useState } from 'react';
import { generateTaskPlan, AITaskSuggestion } from '../services/geminiService';
import { List } from '../types';

interface PlanWithAIModalProps {
    isOpen: boolean;
    onClose: () => void;
    lists: List[];
    onAddPlan: (plan: AITaskSuggestion[]) => void;
}

interface PlanItem extends AITaskSuggestion {
    selected: boolean;
}

export const PlanWithAIModal: React.FC<PlanWithAIModalProps> = ({ isOpen, onClose, lists, onAddPlan }) => {
    const [goal, setGoal] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [plan, setPlan] = useState<PlanItem[]>([]);
    
    if (!isOpen) return null;

    const handleGeneratePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!goal.trim()) return;

        setIsLoading(true);
        setError(null);
        setPlan([]);

        try {
            const listNames = lists.map(l => l.name);
            const generatedTasks = await generateTaskPlan(goal, listNames);
            setPlan(generatedTasks.map(task => ({ ...task, selected: true })));
        } catch (e: any) {
            setError(e.message || "Failed to generate a plan.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleSelection = (index: number) => {
        setPlan(prevPlan => {
            const newPlan = [...prevPlan];
            newPlan[index].selected = !newPlan[index].selected;
            return newPlan;
        });
    };

    const handleAddTasks = () => {
        const selectedTasks = plan.filter(item => item.selected);
        if (selectedTasks.length > 0) {
            onAddPlan(selectedTasks);
        }
    };
    
    const selectedCount = plan.filter(item => item.selected).length;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background-secondary rounded-lg shadow-xl p-8 w-full max-w-2xl flex flex-col" style={{height: '70vh'}} onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-2 text-content-primary">Plan with AI ✨</h2>
                <p className="text-sm text-content-secondary mb-6">Enter a goal or a complex task, and Aura will break it down into actionable steps for you.</p>
                
                <form onSubmit={handleGeneratePlan} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={goal}
                        onChange={e => setGoal(e.target.value)}
                        placeholder="e.g., Launch my personal blog in 30 days"
                        className="flex-grow bg-background-primary border border-border-primary rounded-md px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isLoading}
                        autoFocus
                    />
                    <button type="submit" disabled={isLoading || !goal.trim()} className="px-4 py-2 rounded-md bg-primary hover:bg-primary-focus text-white font-semibold transition-colors disabled:bg-background-tertiary disabled:cursor-not-allowed">
                        {isLoading ? 'Generating...' : 'Generate'}
                    </button>
                </form>

                {error && <p className="text-red-500 text-center text-sm mb-4">{error}</p>}

                <div className="flex-1 overflow-y-auto -mr-4 pr-4 space-y-3">
                    {isLoading && (
                        <div className="flex items-center justify-center h-full">
                            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        </div>
                    )}

                    {plan.length > 0 && (
                        <div className="bg-background-primary/50 p-4 rounded-lg">
                            <h3 className="font-semibold mb-3">Suggested Tasks:</h3>
                            <div className="space-y-2">
                                {plan.map((item, index) => (
                                    <div key={index} className="flex items-center p-2 bg-background-secondary rounded-md">
                                        <input
                                            type="checkbox"
                                            checked={item.selected}
                                            onChange={() => handleToggleSelection(index)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-3"
                                        />
                                        <div className="flex-grow">
                                            <p className="text-content-primary">{item.title}</p>
                                        </div>
                                        <span className="text-xs bg-background-tertiary text-content-secondary px-2 py-1 rounded-full">{item.listName}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {plan.length > 0 && (
                    <div className="flex justify-end pt-6 space-x-3 border-t border-border-primary">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-background-tertiary hover:bg-border-primary text-content-primary font-semibold transition-colors">Cancel</button>
                        <button 
                            type="button" 
                            onClick={handleAddTasks} 
                            disabled={selectedCount === 0}
                            className="px-4 py-2 rounded-md bg-primary hover:bg-primary-focus text-white font-semibold transition-colors disabled:bg-background-tertiary disabled:cursor-not-allowed"
                        >
                            Add {selectedCount} Task{selectedCount !== 1 && 's'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
