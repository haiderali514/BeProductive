import React, { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, Priority, AddTaskFormProps, Tag } from '../types';
import { CalendarIcon, FlagIcon, AttachmentIcon, TemplateIcon, SettingsIcon, PlusIcon, MoreIcon, TagIcon, MoveToListIcon, ChevronRightIcon } from './Icons';
import { Popover, DatePickerPopover } from './Popover';
import { useData } from '../contexts/DataContext';

type ActivePopover = 'main' | 'date';
type PopoverView = 'main' | 'lists' | 'tags';

const TAG_COLORS = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'];

const Pill: React.FC<{ children: React.ReactNode; colorClass: string; onRemove: () => void; }> = ({ children, colorClass, onRemove }) => (
    <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded ${colorClass}`}>
        <span>{children}</span>
        <button onClick={onRemove} type="button" className="ml-1.5 -mr-0.5 p-0.5 rounded-full hover:bg-black/20 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
    </div>
);

// A new, more advanced tag popover component
const TagPopoverContent: React.FC<{
    initialTags: string[];
    onSave: (newTags: string[]) => void;
    onClose: () => void;
}> = ({ initialTags, onSave, onClose }) => {
    const { tags: allTags, handleAddTag } = useData();
    const [selectedTagNames, setSelectedTagNames] = useState<string[]>(initialTags);
    const [search, setSearch] = useState('');

    const toggleTag = (tagName: string) => {
        setSelectedTagNames(prev => prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]);
    };

    const handleCreateTag = () => {
        const newTagName = search.trim();
        if (newTagName && !allTags.some(t => t.name.toLowerCase() === newTagName.toLowerCase())) {
            const newTagColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
            handleAddTag({ name: newTagName, color: newTagColor, parentId: null });
            toggleTag(newTagName);
            setSearch('');
        }
    };
    
    const filteredTags = allTags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    const showCreateOption = search.trim() && !allTags.some(t => t.name.toLowerCase() === search.trim().toLowerCase());

    return (
        <div className="w-64 bg-background-tertiary rounded-lg shadow-xl border border-border-primary text-content-primary flex flex-col max-h-80">
            <div className="p-2 border-b border-border-primary">
                {selectedTagNames.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {selectedTagNames.map(tagName => (
                            <div key={tagName} className="bg-background-primary text-xs flex items-center px-2 py-1 rounded">
                                {tagName}
                                <button onClick={() => toggleTag(tagName)} className="ml-1.5 -mr-1 p-0.5 rounded-full hover:bg-background-tertiary">&times;</button>
                            </div>
                        ))}
                    </div>
                )}
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Type in a tag"
                    className="w-full bg-background-primary p-1.5 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    autoFocus
                />
            </div>
            <div className="p-2 flex-1 overflow-y-auto">
                {showCreateOption && (
                    <button onClick={handleCreateTag} className="w-full text-left p-2 rounded hover:bg-background-primary text-sm text-primary">
                        + Create Tag "{search.trim()}"
                    </button>
                )}
                {filteredTags.map(tag => (
                    <button key={tag.id} onClick={() => toggleTag(tag.name)} className="w-full text-left flex justify-between items-center p-2 rounded hover:bg-background-primary text-sm">
                        <span><TagIcon className="h-4 w-4 inline mr-2" />{tag.name}</span>
                        {selectedTagNames.includes(tag.name) && <span className="text-primary">✓</span>}
                    </button>
                ))}
            </div>
            <div className="p-2 border-t border-border-primary flex justify-end space-x-2">
                <button onClick={onClose} className="px-3 py-1 text-sm rounded bg-background-primary hover:bg-border-primary">Cancel</button>
                <button onClick={() => onSave(selectedTagNames)} className="px-3 py-1 text-sm rounded bg-primary text-white hover:bg-primary-focus">OK</button>
            </div>
        </div>
    );
};

export const SimpleAddTaskForm: React.FC<AddTaskFormProps> = ({ lists, onAddTask, aiEnabled, activeListId, logApiCall, onSettingsChange, onDeactivate, autoFocus }) => {
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [priority, setPriority] = useState<Priority>(Priority.NONE);
    const [tags, setTags] = useState<string[]>([]);
    const [listInfo, setListInfo] = useState<{ listId: string; listName: string; } | null>(null);
    
    const [isFocused, setIsFocused] = useState(false);
    const [activePopover, setActivePopover] = useState<ActivePopover | null>(null);
    const [popoverView, setPopoverView] = useState<PopoverView>('main');

    const { tasks } = useData();
    const isAppendingSyntax = useRef(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const optionsTriggerRef = useRef<HTMLButtonElement>(null);
    const dateTriggerRef = useRef<HTMLButtonElement>(null);
    
     useEffect(() => {
        if (isAppendingSyntax.current) {
            isAppendingSyntax.current = false;
            return;
        }
        let text = title;
        let newTitle = text;
        let needsUpdate = false;
    
        const patterns = {
            priority: /(!(high|medium|low|none))(?=\s|$)/i,
            tag: /(#[\w-]+)(?=\s|$)/i,
            list: /(~[\w\s\/]+)(?=\s|$)/i,
        };
        
        const processMatches = (pattern: RegExp, processor: (match: RegExpMatchArray) => void) => {
            let match;
            while ((match = newTitle.match(pattern)) !== null) {
                processor(match);
                newTitle = newTitle.replace(match[0], '').trim();
                needsUpdate = true;
            }
        };

        processMatches(patterns.priority, (match) => {
            const p = match[2].toLowerCase();
            if (p === 'high') setPriority(Priority.HIGH);
            else if (p === 'medium') setPriority(Priority.MEDIUM);
            else if (p === 'low') setPriority(Priority.LOW);
            else if (p === 'none') setPriority(Priority.NONE);
        });

        processMatches(patterns.tag, (match) => {
            const tagName = match[1].substring(1);
            if (!tags.includes(tagName)) {
                setTags(prev => [...prev, tagName]);
            }
        });

        processMatches(patterns.list, (match) => {
            const listName = match[1].substring(1);
            const foundList = lists.find(l => l.name.toLowerCase() === listName.toLowerCase());
            if (foundList) {
                setListInfo({ listId: foundList.id, listName: foundList.name });
            }
        });
        
        if (needsUpdate) {
            setTitle(newTitle);
        }
    
    }, [title, lists, tags]);

    const isFormEmpty = useCallback(() => {
        return !title.trim() && !dueDate && priority === Priority.NONE && tags.length === 0 && !listInfo;
    }, [title, dueDate, priority, tags, listInfo]);
    
    const resetForm = useCallback(() => {
        setTitle('');
        setDueDate(null);
        setPriority(Priority.NONE);
        setTags([]);
        setListInfo(null);
    }, []);

    const handleSubmit = useCallback((e?: FormEvent) => {
        e?.preventDefault();
        if (!title.trim()) return;

        onAddTask({
            title: title.trim(),
            listId: listInfo?.listId || activeListId,
            priority,
            dueDate: dueDate ? dueDate.toISOString().slice(0, 16).replace('T', ' ') : null,
            recurrence: null,
            tags,
        });
        
        resetForm();
        if (inputRef.current) inputRef.current.blur();
        setIsFocused(false);

    }, [title, priority, dueDate, tags, listInfo, activeListId, onAddTask, resetForm]);

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        setTimeout(() => {
            if (!containerRef.current?.contains(document.activeElement)) {
                 setIsFocused(false);
                 if (isFormEmpty()) {
                    resetForm();
                 }
            }
        }, 150);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
        if(e.key === 'Escape') {
            if (inputRef.current) inputRef.current.blur();
        }
    };
    
    const handleTagsSave = (newTags: string[]) => {
        setTags(newTags);
        setActivePopover(null);
    }
    
    const priorityOptions = [
        { level: Priority.HIGH, color: 'text-red-500' },
        { level: Priority.MEDIUM, color: 'text-yellow-500' },
        { level: Priority.LOW, color: 'text-blue-500' },
        { level: Priority.NONE, color: 'text-content-tertiary' },
    ];
    
    const priorityPillColors: Record<Priority, string> = {
        [Priority.HIGH]: 'bg-red-900/80 text-red-300',
        [Priority.MEDIUM]: 'bg-yellow-900/80 text-yellow-300',
        [Priority.LOW]: 'bg-blue-900/80 text-blue-300',
        [Priority.NONE]: '',
    };

    const genericPillColor = "bg-background-tertiary text-content-secondary";
    const formattedDueDate = dueDate ? dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;

    return (
        <>
        <div ref={containerRef} onFocus={() => setIsFocused(true)} onBlur={handleBlur} className="px-4 pt-4 pb-2 bg-background-primary">
             <div className={`bg-background-secondary rounded-lg border-2 transition-all ${isFocused ? 'border-primary' : 'border-transparent'}`}>
                <form onSubmit={handleSubmit} className="flex items-center px-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="+ Add task"
                        className="w-full bg-transparent text-content-primary placeholder-content-secondary focus:outline-none px-2 py-3"
                    />
                    <button ref={dateTriggerRef} type="button" onClick={() => setActivePopover(p => p === 'date' ? null : 'date')} className={`flex items-center space-x-1 p-1.5 rounded-md hover:bg-background-tertiary ${dueDate ? 'text-primary' : 'text-content-secondary'}`}>
                        <CalendarIcon className="h-5 w-5"/>
                        {formattedDueDate && <span className="text-sm font-semibold">{formattedDueDate}</span>}
                    </button>
                    <button ref={optionsTriggerRef} type="button" onClick={() => { setActivePopover(p => p === 'main' ? null : 'main'); setPopoverView('main'); }} className="flex items-center space-x-1 p-1.5 rounded-md text-content-secondary hover:bg-background-tertiary">
                        <MoreIcon className="h-5 w-5" />
                    </button>
                </form>

                 {(tags.length > 0 || priority !== Priority.NONE || dueDate || listInfo) && (
                    <div className="flex items-center flex-wrap gap-1 px-4 pb-2">
                        {priority !== Priority.NONE && (
                            <Pill colorClass={priorityPillColors[priority]} onRemove={() => setPriority(Priority.NONE)}>
                                !{priority.toLowerCase()}
                            </Pill>
                        )}
                        {listInfo && (
                            <Pill colorClass={genericPillColor} onRemove={() => setListInfo(null)}>
                                ~{listInfo.listName}
                            </Pill>
                        )}
                        {tags.map(tag => (
                            <Pill key={tag} colorClass={genericPillColor} onRemove={() => setTags(t => t.filter(x => x !== tag))}>
                                #{tag}
                            </Pill>
                        ))}
                         {dueDate && (
                            <Pill colorClass={genericPillColor} onRemove={() => setDueDate(null)}>
                                {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Pill>
                        )}
                    </div>
                )}
            </div>
        </div>

        <Popover isOpen={activePopover === 'main'} onClose={() => setActivePopover(null)} triggerRef={optionsTriggerRef} position="bottom-end">
             <div className="w-64 bg-background-tertiary rounded-lg shadow-2xl border border-border-primary text-content-primary p-2">
                {popoverView === 'main' && (
                    <>
                        <div>
                            <span className="px-2 text-xs text-content-tertiary">Priority:</span>
                            <div className="flex justify-around p-2">
                                {priorityOptions.map(opt => (
                                    <button key={opt.level} onClick={() => { setPriority(opt.level); setActivePopover(null); }} className={`p-1 rounded ${priority === opt.level ? 'bg-primary/20' : ''}`}><FlagIcon className={`h-4 w-4 ${opt.color}`} /></button>
                                ))}
                            </div>
                        </div>
                        <div className="border-t border-border-primary my-1"></div>
                        <button onClick={() => setPopoverView('lists')} className="w-full flex justify-between items-center p-2 rounded hover:bg-background-primary">
                            <div className="flex items-center space-x-2"><MoveToListIcon className="h-4 w-4" /><span>List</span></div>
                            <div className="flex items-center space-x-2"><span className="text-xs text-content-tertiary">{listInfo?.listName || 'Inbox'}</span><ChevronRightIcon className="h-4 w-4 text-content-tertiary"/></div>
                        </button>
                        <button onClick={() => setPopoverView('tags')} className="w-full text-left flex items-center p-2 rounded hover:bg-background-primary"><TagIcon className="h-4 w-4 mr-2" />Tags</button>
                        <div className="border-t border-border-primary my-1"></div>
                        <button onMouseDown={(e) => { e.preventDefault(); onSettingsChange({ taskInputStyle: 'detailed' }); setActivePopover(null); }} className="w-full text-left flex items-center p-2 rounded hover:bg-background-primary"><SettingsIcon className="mr-2 h-4 w-4"/> Input Box Setting</button>
                    </>
                )}
                {popoverView === 'lists' && (
                    <div>
                         <button onClick={() => setPopoverView('main')} className="w-full text-left p-2 rounded hover:bg-background-primary text-sm">&lt; Back</button>
                         <div className="border-t border-border-primary my-1"></div>
                         {lists.map(list => (
                             <button key={list.id} onClick={() => { setListInfo({listId: list.id, listName: list.name}); setActivePopover(null); }} className="w-full text-left p-2 rounded hover:bg-background-primary">{list.name}</button>
                         ))}
                    </div>
                )}
                {popoverView === 'tags' && (
                    <TagPopoverContent initialTags={tags} onSave={handleTagsSave} onClose={() => setActivePopover(null)} />
                )}
             </div>
        </Popover>

        <Popover isOpen={activePopover === 'date'} onClose={() => setActivePopover(null)} triggerRef={dateTriggerRef} position="bottom-end">
            <div className="bg-background-tertiary rounded-lg shadow-2xl border border-border-primary text-content-primary">
                 <DatePickerPopover selectedDate={dueDate} onDateChange={(d) => {setDueDate(d); setActivePopover(null);}} onClose={() => setActivePopover(null)} />
            </div>
        </Popover>
        </>
    );
};