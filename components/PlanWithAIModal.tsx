import React, { useState } from 'react';
import { generateTaskPlan, AITaskSuggestion } from '../services/geminiService';
import { List } from '../types';
import { ApiFeature } from '../hooks/useApiUsage';
import { CloseIcon } from './Icons';

interface PlanWithAIModalProps {
    isOpen: boolean;
    onClose: () => void;
    lists: List[];
    onAddPlan: (plan: AITaskSuggestion[]) => void;
    logApiCall: (feature: ApiFeature, tokens: number) => void;
}

interface PlanItem extends AITaskSuggestion {
    selected: boolean;
}

export const PlanWithAIModal: React.FC<PlanWithAIModalProps> = ({ isOpen, onClose, lists, onAddPlan, logApiCall }) => {
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
            const { data: generatedTasks, tokensUsed } = await generateTaskPlan(goal, listNames);
            logApiCall('planWithAI', tokensUsed);
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
            <div className="bg-background-secondary rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[70vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border-primary flex justify-between items-center">
                    <h2 className="text-xl font-bold text-content-primary">Plan with AI ✨</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-content-tertiary hover:bg-background-tertiary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-content-secondary mb-4">Enter a goal or a complex task, and Aura will break it down into actionable steps for you.</p>
                    <form onSubmit={handleGeneratePlan} className="flex gap-2">
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
                    {error && <p className="text-red-500 text-center text-sm mt-2">{error}</p>}
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6 -mr-4 pr-4 space-y-3">
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
                    <div className="p-4 bg-background-primary rounded-b-lg flex justify-end space-x-3">
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