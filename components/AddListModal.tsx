import React, { useState } from 'react';
import { List } from '../types';

interface AddListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddList: (listData: { name: string; emoji: string; color: string; }) => void;
}

const LIST_COLORS = ['#d3d3d3', '#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#3f51b5', '#9c27b0', '#607d8b'];

export const AddListModal: React.FC<AddListModalProps> = ({ isOpen, onClose, onAddList }) => {
    const [name, setName] = useState('');
    const [emoji, setEmoji] = useState('🎉');
    const [color, setColor] = useState(LIST_COLORS[0]);

    if (!isOpen) return null;

    const handleCreate = () => {
        if (name.trim()) {
            onAddList({ name: name.trim(), emoji, color });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background-secondary rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border-primary flex justify-between items-center">
                    <h2 className="text-xl font-bold">Add List</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-content-tertiary hover:bg-background-tertiary">&times;</button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="flex items-center space-x-2 border border-border-primary p-2 rounded-lg bg-background-primary">
                        <input
                            type="text"
                            value={emoji}
                            onChange={(e) => setEmoji(e.target.value)}
                            className="w-8 h-8 text-center bg-transparent focus:outline-none"
                            maxLength={2}
                        />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="flex-1 bg-transparent text-lg font-semibold focus:outline-none"
                            placeholder="List Name"
                            autoFocus
                        />
                    </div>
                    <div>
                         <label className="text-sm font-medium text-content-secondary mb-2 block">List Color</label>
                         <div className="flex space-x-3">
                            {LIST_COLORS.map(c => (
                                <button key={c} onClick={() => setColor(c)} className="w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-background-secondary" style={{ backgroundColor: c, borderColor: color === c ? '#4A90E2' : 'transparent' }}></button>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="p-4 bg-background-primary flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-background-tertiary hover:bg-border-primary text-content-primary font-semibold">
                        Cancel
                    </button>
                    <button onClick={handleCreate} disabled={!name.trim()} className="px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary-focus disabled:bg-background-tertiary disabled:text-content-tertiary">
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
};