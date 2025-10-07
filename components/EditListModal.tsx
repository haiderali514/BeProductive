import React, { useState, useEffect } from 'react';
import { List } from '../types';

interface EditListModalProps {
    isOpen: boolean;
    onClose: () => void;
    list: List | null;
    onSave: (list: Partial<List>) => void;
}

const LIST_COLORS = ['#d3d3d3', '#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#3f51b5', '#9c27b0', '#607d8b'];

export const EditListModal: React.FC<EditListModalProps> = ({ isOpen, onClose, list, onSave }) => {
    const [formData, setFormData] = useState<Partial<List>>({});

    useEffect(() => {
        if (list) {
            setFormData({
                name: list.name,
                color: list.color || '#d3d3d3',
                emoji: list.emoji || '•'
            });
        }
    }, [list]);

    if (!isOpen || !list) return null;

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    const isSimpleMode = list.id === 'inbox';

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background-secondary rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border-primary flex justify-between items-center">
                    <h2 className="text-xl font-bold">Edit List</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-content-tertiary hover:bg-background-tertiary">&times;</button>
                </div>
                
                {isSimpleMode ? (
                    // Simple Modal for Inbox
                    <div className="p-6">
                        <label className="text-sm font-medium text-content-secondary mb-2 block">Color</label>
                        <div className="flex space-x-3">
                            {LIST_COLORS.map(color => (
                                <button key={color} onClick={() => setFormData(f => ({ ...f, color }))} className="w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-background-secondary" style={{ backgroundColor: color, borderColor: formData.color === color ? '#4A90E2' : 'transparent' }}></button>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Full Modal for user lists
                    <div className="p-6 space-y-4">
                        <div className="flex items-center space-x-2 border border-border-primary p-2 rounded-lg bg-background-primary">
                            <input
                                type="text"
                                value={formData.emoji}
                                onChange={(e) => setFormData(f => ({ ...f, emoji: e.target.value }))}
                                className="w-8 h-8 text-center bg-transparent focus:outline-none"
                                maxLength={2}
                            />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                                className="flex-1 bg-transparent text-lg font-semibold focus:outline-none"
                            />
                        </div>
                        <div>
                             <label className="text-sm font-medium text-content-secondary mb-2 block">List Color</label>
                             <div className="flex space-x-3">
                                {LIST_COLORS.map(color => (
                                    <button key={color} onClick={() => setFormData(f => ({ ...f, color }))} className="w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-background-secondary" style={{ backgroundColor: color, borderColor: formData.color === color ? '#4A90E2' : 'transparent' }}></button>
                                ))}
                            </div>
                        </div>
                        <div>
                             <label className="text-sm font-medium text-content-secondary mb-2 block">View Type</label>
                             <div className="flex space-x-2">
                                <button className="px-4 py-2 rounded-md bg-primary/20 text-primary">List</button>
                                <button className="px-4 py-2 rounded-md bg-background-tertiary">Grid</button>
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-content-secondary mb-1 block">Folder</label>
                                <select className="w-full bg-background-primary border border-border-primary p-2 rounded-md"><option>None</option></select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-content-secondary mb-1 block">List Type</label>
                                <select className="w-full bg-background-primary border border-border-primary p-2 rounded-md"><option>Task List</option></select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-content-secondary mb-1 block">Show in Smart List</label>
                            <select className="w-full bg-background-primary border border-border-primary p-2 rounded-md"><option>All tasks</option></select>
                        </div>
                    </div>
                )}
                
                <div className="p-4 bg-background-primary flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-background-tertiary hover:bg-border-primary text-content-primary font-semibold">
                        {isSimpleMode ? 'Close' : 'Cancel'}
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary-focus">Save</button>
                </div>
            </div>
        </div>
    );
};
