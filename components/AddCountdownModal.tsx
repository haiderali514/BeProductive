import React, { useState } from 'react';
import { DateTimePicker } from './DateTimePicker';
import { CloseIcon } from './Icons';

interface AddCountdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCountdown: (title: string, date: string) => void;
}

export const AddCountdownModal: React.FC<AddCountdownModalProps> = ({ isOpen, onClose, onAddCountdown }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    });
    
    if (!isOpen) return null;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && date) {
            onAddCountdown(title.trim(), date.toISOString());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background-secondary rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border-primary flex justify-between items-center">
                    <h2 className="text-xl font-bold text-content-primary">Add New Countdown</h2>
                     <button onClick={onClose} className="p-2 rounded-full text-content-tertiary hover:bg-background-tertiary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                        <div>
                            <label htmlFor="countdown-title" className="block text-sm font-medium text-content-secondary mb-1">Event Title</label>
                            <input
                                type="text"
                                id="countdown-title"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-background-primary border border-border-primary rounded-md px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="e.g., Project Launch"
                                required
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-content-secondary mb-1">Date & Time</label>
                            <DateTimePicker value={date} onChange={setDate} />
                        </div>
                    </div>
                    <div className="p-4 bg-background-primary rounded-b-lg flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-background-tertiary hover:bg-border-primary text-content-primary font-semibold transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-primary hover:bg-primary-focus text-white font-semibold transition-colors">Add Countdown</button>
                    </div>
                </form>
            </div>
        </div>
    );
};