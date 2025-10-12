import React, { useState } from 'react';
import { CloseIcon } from './Icons';

interface CreateHabitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddHabit: (habitData: { name: string; icon: string; period: 'Morning' | 'Afternoon' | 'Night' }) => void;
}

export const CreateHabitModal: React.FC<CreateHabitModalProps> = ({ isOpen, onClose, onAddHabit }) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('😊');
    const [period, setPeriod] = useState<'Morning' | 'Afternoon' | 'Night'>('Morning');
    
    if (!isOpen) return null;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onAddHabit({ name: name.trim(), icon, period });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background-secondary rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border-primary flex justify-between items-center">
                    <h2 className="text-xl font-bold text-content-primary">Create New Habit</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-content-tertiary hover:bg-background-tertiary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                        <div>
                            <label htmlFor="habit-name" className="block text-sm font-medium text-content-secondary mb-1">Habit Name</label>
                            <input
                                type="text"
                                id="habit-name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-background-primary border border-border-primary rounded-md px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="e.g., Read a book"
                                required
                                autoFocus
                            />
                        </div>
                        <div>
                            <label htmlFor="habit-icon" className="block text-sm font-medium text-content-secondary mb-1">Icon (Emoji)</label>
                            <input
                                type="text"
                                id="habit-icon"
                                value={icon}
                                onChange={e => setIcon(e.target.value)}
                                maxLength={2}
                                className="w-full bg-background-primary border border-border-primary rounded-md px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="😊"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-content-secondary mb-2">Period</label>
                            <div className="flex space-x-2">
                                {(['Morning', 'Afternoon', 'Night'] as const).map(p => (
                                    <button
                                        type="button"
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${period === p ? 'bg-primary text-white' : 'bg-background-tertiary hover:bg-border-primary'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-background-primary rounded-b-lg flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-background-tertiary hover:bg-border-primary text-content-primary font-semibold transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-primary hover:bg-primary-focus text-white font-semibold transition-colors">Create Habit</button>
                    </div>
                </form>
            </div>
        </div>
    );
};