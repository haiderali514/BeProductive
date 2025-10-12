import React, { useState, useRef, useEffect } from 'react';
import { List } from '../types';
import { CloseIcon, SmileyFaceIcon, LibraryIcon, GridViewIcon, ColumnsViewIcon, TrophyIcon, BanIcon, PlusIcon, SearchIcon } from './Icons';
import { Popover } from './Popover';

interface AddListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddList: (listData: { name: string; emoji: string; color: string; }) => void;
}

const LIST_COLORS_PRESETS = {
    Classic: ['#d3d3d3', '#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#3f51b5', '#9c27b0'],
    Macaron: ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', '#e0baff', '#f8bbd0', '#ffc8a2'],
    Morandi: ['#c4a77d', '#e2c2a0', '#a2b0a5', '#6b7b83', '#8e9e8c', '#d3b8ae', '#9ca8b8', '#c9c0d3'],
};

const EMOJI_CATEGORIES = {
    'Frequently Used': ['🎉', '😊', '💼', '📖', '❤️', '🔥', '🚀', '💡'],
    'People & Body': ['😀', '😂', '😍', '🤔', '👋', '👍', '🙏', '💪'],
    'Animals & Nature': ['🐶', '🐱', '🦄', '🌍', '🌳', '🌸', '☀️', '🌙'],
    'Food & Drink': ['🍎', '🍕', '☕', '🎂', '🍇', '🥑', '🌮', '🍦'],
};


const CustomColorPicker: React.FC<{ onSave: (color: string) => void, onClose: () => void }> = ({ onSave, onClose }) => {
    const [color, setColor] = useState('#ffffff');
    // In a real app, you'd use a color picker library. We'll simulate it.
    return (
        <div className="w-64 bg-background-tertiary rounded-lg shadow-xl border border-border-primary p-4" onClick={e => e.stopPropagation()}>
            <div className="w-full h-32 bg-gradient-to-br from-white to-black rounded" style={{ backgroundColor: 'red' /* Represents hue */ }}></div>
            <div className="w-full h-4 mt-2 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 rounded"></div>
            <input type="text" value={color} onChange={e => setColor(e.target.value)} className="w-full bg-background-primary p-2 mt-2 rounded border border-border-primary"/>
            <div className="flex justify-end space-x-2 mt-4">
                <button onClick={onClose} className="px-3 py-1 text-sm rounded bg-background-primary hover:bg-border-primary">Cancel</button>
                <button onClick={() => onSave(color)} className="px-3 py-1 text-sm rounded bg-primary text-white hover:bg-primary-focus">Save</button>
            </div>
        </div>
    );
};

const NewFolderModal: React.FC<{onClose: () => void, onSave: (name: string) => void}> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    return (
         <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center" onClick={onClose}>
            <div className="bg-background-secondary rounded-lg shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">New Folder</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-content-tertiary hover:bg-background-tertiary">&times;</button>
                </div>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Name"
                    className="w-full bg-background-primary border border-border-primary rounded-md px-3 py-2"
                    autoFocus
                />
                 <div className="flex justify-end pt-4 space-x-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-background-tertiary hover:bg-border-primary font-semibold">Close</button>
                    <button onClick={() => { onSave(name); onClose(); }} className="px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary-focus">Save</button>
                </div>
            </div>
        </div>
    );
};

const EmojiPicker: React.FC<{onSelect: (emoji: string) => void}> = ({ onSelect }) => {
    return (
        <div className="w-72 bg-background-tertiary rounded-lg shadow-xl border border-border-primary p-2 flex flex-col h-80">
            <div className="relative mb-2">
                <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary"/>
                <input type="text" placeholder="Search" className="w-full bg-background-primary pl-8 pr-2 py-1.5 rounded text-sm"/>
            </div>
            <div className="flex-1 overflow-y-auto">
                {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                    <div key={category}>
                        <h4 className="text-xs font-bold uppercase text-content-tertiary px-2 py-1">{category}</h4>
                        <div className="grid grid-cols-8 gap-1 p-1">
                            {emojis.map(emoji => (
                                <button key={emoji} onClick={() => onSelect(emoji)} className="text-2xl rounded hover:bg-background-primary p-1">{emoji}</button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
};


export const AddListModal: React.FC<AddListModalProps> = ({ isOpen, onClose, onAddList }) => {
    const [name, setName] = useState('');
    const [emoji, setEmoji] = useState('🎉');
    const [color, setColor] = useState(LIST_COLORS_PRESETS.Classic[1]);
    const [viewType, setViewType] = useState('list');
    const [folder, setFolder] = useState('None');
    
    // Popover states
    const [isEmojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [isCustomColorOpen, setIsCustomColorOpen] = useState(false);
    const [isFolderPopoverOpen, setFolderPopoverOpen] = useState(false);
    const [isNewFolderModalOpen, setNewFolderModalOpen] = useState(false);

    // Popover trigger refs
    const emojiTriggerRef = useRef<HTMLButtonElement>(null);
    const colorTriggerRef = useRef<HTMLButtonElement>(null);
    const folderTriggerRef = useRef<HTMLButtonElement>(null);

    if (!isOpen) return null;

    const handleCreate = () => {
        if (name.trim()) {
            onAddList({ name: name.trim(), emoji, color });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background-secondary rounded-lg shadow-2xl w-full max-w-[800px] flex" onClick={e => e.stopPropagation()}>
                {/* Left Column - Form */}
                <div className="w-1/2 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Add List</h2>
                        <button onClick={onClose} className="p-2 rounded-full text-content-tertiary hover:bg-background-tertiary">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="space-y-4 flex-1">
                        <div className="flex items-center space-x-2 border border-border-primary p-2 rounded-lg bg-background-primary focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                            <button ref={emojiTriggerRef} onClick={() => setEmojiPickerOpen(true)} className="w-8 h-8 flex items-center justify-center text-xl bg-transparent focus:outline-none">{emoji}</button>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 bg-transparent text-lg font-semibold focus:outline-none" placeholder="Name" autoFocus/>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-content-secondary mb-2 block">List Color</label>
                            <div className="flex space-x-2 items-center">
                                <button onClick={() => setColor('transparent')} className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ring-2 ring-offset-2 ring-offset-background-secondary ${color === 'transparent' ? 'ring-primary' : 'ring-transparent'}`}><BanIcon className="w-4 h-4 text-content-tertiary" /></button>
                                {LIST_COLORS_PRESETS.Classic.map(c => (
                                    <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full transition-all ring-2 ring-offset-2 ring-offset-background-secondary ${color === c ? 'ring-primary' : 'ring-transparent'}`} style={{ backgroundColor: c }}></button>
                                ))}
                                <button ref={colorTriggerRef} onClick={() => setIsColorPickerOpen(true)} className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500"></button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-content-secondary mb-2 block">View Type</label>
                            <div className="flex space-x-2 bg-background-primary p-1 rounded-md">
                                <button onClick={() => setViewType('list')} className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded transition-colors ${viewType === 'list' ? 'bg-primary text-white' : 'hover:bg-background-tertiary'}`}><LibraryIcon className="w-5 h-5" /></button>
                                <button onClick={() => setViewType('grid')} className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded transition-colors ${viewType === 'grid' ? 'bg-primary text-white' : 'hover:bg-background-tertiary'}`}><GridViewIcon className="w-5 h-5" /></button>
                                <button className="flex-1 flex items-center justify-center space-x-2 py-2 rounded relative text-content-tertiary cursor-not-allowed"><ColumnsViewIcon className="w-5 h-5" /><div className="absolute top-1 right-1 text-yellow-400"><TrophyIcon className="w-3 h-3"/></div></button>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-content-secondary mb-1 block">Folder</label>
                            <button ref={folderTriggerRef} onClick={() => setFolderPopoverOpen(true)} className="w-full flex justify-between items-center bg-background-primary border border-border-primary p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-left"><span className="text-sm">{folder}</span><span>⌄</span></button>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-content-secondary mb-1 block">List Type</label>
                            <select className="w-full bg-background-primary border border-border-primary p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm"><option>Task List</option><option>Note List</option></select>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-content-secondary mb-1 block">Show in Smart List</label>
                            <select className="w-full bg-background-primary border border-border-primary p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm"><option>All tasks</option><option>Do not show</option></select>
                        </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end space-x-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-md bg-background-primary hover:bg-border-primary text-content-primary font-semibold">Cancel</button>
                        <button onClick={handleCreate} disabled={!name.trim()} className="px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary-focus disabled:bg-background-tertiary disabled:text-content-tertiary">Add</button>
                    </div>
                </div>

                {/* Right Column - Preview */}
                <div className="w-1/2 p-6 bg-background-primary rounded-r-lg flex items-center justify-center">
                    <div className="w-full max-w-xs bg-background-secondary p-4 rounded-lg border border-border-primary">
                        <div className="flex items-center space-x-2 mb-3"><div className="w-4 h-4 rounded bg-content-tertiary/20"></div><p className="text-sm font-semibold text-content-tertiary">Name</p></div>
                        <div className="space-y-2">
                           {[...Array(5)].map((_, i) => (
                               <div key={i} className="flex items-center space-x-2">
                                   <div className="w-4 h-4 border-2 border-content-tertiary/50 rounded"></div>
                                   <div className="h-2 flex-1 bg-content-tertiary/20 rounded-full"></div>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Popovers and Modals */}
            <Popover isOpen={isEmojiPickerOpen} onClose={() => setEmojiPickerOpen(false)} triggerRef={emojiTriggerRef}>
                <EmojiPicker onSelect={(e) => { setEmoji(e); setEmojiPickerOpen(false); }} />
            </Popover>
            <Popover isOpen={isColorPickerOpen} onClose={() => setIsColorPickerOpen(false)} triggerRef={colorTriggerRef}>
                <div className="w-64 bg-background-tertiary rounded-lg shadow-xl border border-border-primary p-4 space-y-4">
                     {Object.entries(LIST_COLORS_PRESETS).map(([name, colors]) => (
                        <div key={name}>
                            <h4 className="text-sm font-semibold mb-2">{name}</h4>
                            <div className="grid grid-cols-8 gap-2">
                                {colors.map(c => <button key={c} onClick={() => { setColor(c); setIsColorPickerOpen(false); }} className={`w-6 h-6 rounded-full ring-2 ring-offset-2 ring-offset-background-tertiary ${color === c ? 'ring-primary' : 'ring-transparent'}`} style={{backgroundColor: c}}></button>)}
                            </div>
                        </div>
                     ))}
                     <div className="border-t border-border-primary pt-3">
                        <h4 className="text-sm font-semibold mb-2">Custom</h4>
                        <button onClick={() => setIsCustomColorOpen(true)} className="w-6 h-6 rounded-full border-2 border-dashed border-content-tertiary flex items-center justify-center"><PlusIcon /></button>
                     </div>
                </div>
            </Popover>
             {isCustomColorOpen && (
                <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center" onClick={() => setIsCustomColorOpen(false)}>
                    <CustomColorPicker onSave={(c) => { setColor(c); setIsCustomColorOpen(false); setIsColorPickerOpen(false); }} onClose={() => setIsCustomColorOpen(false)} />
                </div>
             )}
              <Popover isOpen={isFolderPopoverOpen} onClose={() => setFolderPopoverOpen(false)} triggerRef={folderTriggerRef}>
                <div className="w-full bg-background-tertiary rounded-lg shadow-xl border border-border-primary p-2">
                    <button onClick={() => { setFolder('None'); setFolderPopoverOpen(false); }} className="w-full text-left p-2 text-sm rounded hover:bg-background-primary">None</button>
                    <div className="border-t border-border-primary my-1"></div>
                    <button onClick={() => { setNewFolderModalOpen(true); setFolderPopoverOpen(false); }} className="w-full text-left p-2 text-sm rounded hover:bg-background-primary text-primary flex items-center space-x-2"><PlusIcon/><span>New Folder</span></button>
                </div>
            </Popover>
            {isNewFolderModalOpen && <NewFolderModal onClose={() => setNewFolderModalOpen(false)} onSave={(name) => setFolder(name)} />}
        </div>
    );
};