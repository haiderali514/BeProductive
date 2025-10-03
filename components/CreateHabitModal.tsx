import React, { useState } from 'react';

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
            <div className="bg-background-secondary rounded-lg shadow-xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 text-content-primary">Create New Habit</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
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
                    <div className="flex justify-end pt-4 space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-background-tertiary hover:bg-border-primary text-content-primary font-semibold transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-primary hover:bg-primary-focus text-white font-semibold transition-colors">Create Habit</button>
                    </div>
                </form>
            </div>
        </div>
    );
};