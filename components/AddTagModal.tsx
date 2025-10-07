import React, { useState } from 'react';
import { Tag } from '../types';

interface AddTagModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTag: (tagData: { name: string; color: string; parentId: string | null }) => void;
    tags: Tag[];
}

const TAG_COLORS = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'];

export const AddTagModal: React.FC<AddTagModalProps> = ({ isOpen, onClose, onAddTag, tags }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState(TAG_COLORS[0]);
    const [parentId, setParentId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onAddTag({ name: name.trim(), color, parentId });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background-secondary rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-content-primary">Add Tag</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-content-tertiary hover:bg-background-tertiary">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Tag Name"
                            className="w-full bg-background-primary border border-border-primary rounded-md px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-content-secondary mb-2">Color</label>
                        <div className="grid grid-cols-9 gap-2">
                            {TAG_COLORS.map(c => (
                                <button
                                    type="button"
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-6 h-6 rounded-full ring-2 ring-offset-2 ring-offset-background-secondary ${color === c ? 'ring-primary' : 'ring-transparent'}`}
                                    style={{ backgroundColor: c }}
                                    aria-label={`Select color ${c}`}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="parent-tag" className="block text-sm font-medium text-content-secondary mb-1">Parent Tag</label>
                        <select
                            id="parent-tag"
                            value={parentId || ''}
                            onChange={e => setParentId(e.target.value || null)}
                            className="w-full bg-background-primary border border-border-primary rounded-md px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">None</option>
                            {tags.map(tag => (
                                <option key={tag.id} value={tag.id}>{tag.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end pt-2 space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-background-tertiary hover:bg-border-primary text-content-primary font-semibold">Close</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-primary hover:bg-primary-focus text-white font-semibold">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
