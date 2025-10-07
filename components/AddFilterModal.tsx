import React, { useState } from 'react';
import { List, Tag, Priority, FilterDateOption, Filter } from '../types';

interface AddFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddFilter: (filterData: Omit<Filter, 'id'>) => void;
    lists: List[];
    tags: Tag[];
}

export const AddFilterModal: React.FC<AddFilterModalProps> = ({ isOpen, onClose, onAddFilter, lists, tags }) => {
    const [name, setName] = useState('');
    const [selectedLists, setSelectedLists] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [date, setDate] = useState<FilterDateOption>('any');
    const [priority, setPriority] = useState<Priority | 'All'>('All');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onAddFilter({
                name: name.trim(),
                lists: selectedLists,
                tags: selectedTags,
                date,
                priority,
                type: 'task', // Defaulting to task type
            });
            onClose();
        }
    };

    const handleListToggle = (listId: string) => {
        setSelectedLists(prev => 
            prev.includes(listId) ? prev.filter(id => id !== listId) : [...prev, listId]
        );
    };

    const handleTagToggle = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background-secondary rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border-primary flex justify-between items-center">
                    <h2 className="text-lg font-bold">Add Filter</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-content-tertiary hover:bg-background-tertiary">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Filter Name, e.g., This Week's E-book Reading"
                                className="w-full bg-background-primary border border-border-primary rounded-md px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                                autoFocus
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-content-secondary mb-1">Lists</label>
                            <div className="max-h-32 overflow-y-auto bg-background-primary border border-border-primary rounded-md p-2 space-y-1">
                                {lists.map(l => (
                                    <label key={l.id} className="flex items-center space-x-2 p-1 rounded hover:bg-background-tertiary">
                                        <input type="checkbox" checked={selectedLists.includes(l.id)} onChange={() => handleListToggle(l.id)} className="text-primary focus:ring-primary"/>
                                        <span>{l.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-content-secondary mb-1">Tags</label>
                             <div className="max-h-32 overflow-y-auto bg-background-primary border border-border-primary rounded-md p-2 space-y-1">
                                {tags.map(t => (
                                    <label key={t.id} className="flex items-center space-x-2 p-1 rounded hover:bg-background-tertiary">
                                        <input type="checkbox" checked={selectedTags.includes(t.id)} onChange={() => handleTagToggle(t.id)} className="text-primary focus:ring-primary"/>
                                        <span>{t.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-content-secondary mb-1">Date</label>
                             <select value={date} onChange={e => setDate(e.target.value as FilterDateOption)} className="w-full bg-background-primary border border-border-primary rounded-md px-3 py-2 text-content-primary">
                                <option value="any">Any Time</option>
                                <option value="today">Today</option>
                                <option value="tomorrow">Tomorrow</option>
                                <option value="thisWeek">This Week</option>
                                <option value="thisMonth">This Month</option>
                                <option value="overdue">Overdue</option>
                             </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-content-secondary mb-2">Priority</label>
                             <div className="flex flex-wrap gap-x-4 gap-y-2">
                                {(['All', Priority.HIGH, Priority.MEDIUM, Priority.LOW, Priority.NONE] as const).map(p => (
                                    <label key={p} className="flex items-center space-x-2 cursor-pointer">
                                        <input type="radio" name="priority" value={p} checked={priority === p} onChange={() => setPriority(p)} className="text-primary focus:ring-primary"/>
                                        <span>{p}</span>
                                    </label>
                                ))}
                             </div>
                        </div>

                    </div>
                    <div className="p-4 bg-background-primary flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-background-tertiary hover:bg-border-primary font-semibold">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary-focus">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
