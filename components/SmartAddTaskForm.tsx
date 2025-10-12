import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, Priority, AddTaskFormProps, Tag, Task } from '../types';
import { CalendarIcon, FlagSolidIcon, PlusIcon, TagIcon, MoveToListIcon, AttachmentIcon, MoreIcon, TemplateIcon, SettingsIcon, ChevronRightIcon } from './Icons';
import { Popover, DatePickerPopover } from './Popover';
import { useData } from '../contexts/DataContext';
import { InputStyleSettingModal } from './InputStyleSettingModal';

const Pill: React.FC<{ children: React.ReactNode; colorClass: string; onRemove: () => void; }> = ({ children, colorClass, onRemove }) => (
    <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded ${colorClass}`}>
        <span>{children}</span>
        <button onClick={onRemove} type="button" className="ml-1.5 -mr-0.5 p-0.5 rounded-full hover:bg-black/20 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
    </div>
);

const TAG_COLORS = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'];

// A new, more advanced tag popover component
const TagPopoverContent: React.FC<{
    initialTags: string[];
    onSave: (newTags: string[]) => void;
    onClose: () => void;
    allTags: Tag[];
    onAddTag: (tagData: { name: string; color: string; parentId: string | null; }) => void;
}> = ({ initialTags, onSave, onClose, allTags, onAddTag }) => {
    const [selectedTagNames, setSelectedTagNames] = useState<string[]>(initialTags);
    const [search, setSearch] = useState('');

    const toggleTag = (tagName: string) => {
        setSelectedTagNames(prev => prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]);
    };

    const handleCreateTag = () => {
        const newTagName = search.trim();
        if (newTagName && !allTags.some(t => t.name.toLowerCase() === newTagName.toLowerCase())) {
            const newTagColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
            onAddTag({ name: newTagName, color: newTagColor, parentId: null });
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


export const SmartAddTaskForm: React.FC<AddTaskFormProps> = ({ lists, onAddTask, aiEnabled, activeListId, settings, onSettingsChange }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [priority, setPriority] = useState<Priority>(Priority.NONE);
    const [tags, setTags] = useState<string[]>([]);
    const [listInfo, setListInfo] = useState<{ listId: string; listName: string; } | null>(null);
    const [dueDate, setDueDate] = useState<Date | null>(null);
    
    const [activePopover, setActivePopover] = useState<'date' | 'priority' | 'list' | 'tag' | 'more' | null>(null);
    const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
    
    const [hoveredListId, setHoveredListId] = useState<string | null>(null);

    const formRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dateTriggerRef = useRef<HTMLButtonElement>(null);
    const priorityTriggerRef = useRef<HTMLButtonElement>(null);
    const listTriggerRef = useRef<HTMLButtonElement>(null);
    const tagTriggerRef = useRef<HTMLButtonElement>(null);
    const moreTriggerRef = useRef<HTMLButtonElement>(null);
    const listSubmenuRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const { tasks, tags: allTags, handleAddTag } = useData();
    const isAppendingSyntax = useRef(false);

    const sectionsByList = useMemo(() => {
        return tasks.reduce((acc, task) => {
            if (task.isSection) {
                if (!acc[task.listId]) {
                    acc[task.listId] = [];
                }
                acc[task.listId].push(task);
            }
            return acc;
        }, {} as Record<string, Task[]>);
    }, [tasks]);

    const isFormEmpty = useCallback(() => {
        return !inputValue.trim() && tags.length === 0 && priority === Priority.NONE && !dueDate && !listInfo;
    }, [inputValue, tags, priority, dueDate, listInfo]);

    const resetForm = useCallback(() => {
        setInputValue('');
        setPriority(Priority.NONE);
        setTags([]);
        setListInfo(null);
        setDueDate(null);
    }, []);

    const handleSubmit = useCallback((e?: React.FormEvent) => {
        e?.preventDefault();
        const finalTitle = inputValue.trim();
        if (!finalTitle) {
            return;
        }

        const isSection = finalTitle.endsWith(':');
        
        onAddTask({
            title: isSection ? finalTitle.slice(0, -1) : finalTitle,
            listId: listInfo?.listId || activeListId,
            priority,
            dueDate: dueDate ? dueDate.toISOString().slice(0, 16).replace('T', ' ') : null,
            recurrence: null,
            tags,
            isSection,
        });

        resetForm();
        setIsFocused(false);
        if (inputRef.current) inputRef.current.blur();
    }, [inputValue, listInfo, activeListId, priority, dueDate, tags, onAddTask, resetForm]);
    
    useEffect(() => {
        if (isAppendingSyntax.current) {
            isAppendingSyntax.current = false;
            return;
        }

        let text = inputValue;
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
            setInputValue(newTitle);
        }
    
    }, [inputValue, lists, tags]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
        if (e.key === 'Escape') {
            e.currentTarget.blur();
        }
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        setTimeout(() => {
            if (!formRef.current?.contains(document.activeElement)) {
                 setIsFocused(false);
            }
        }, 150);
    };
    
    const appendSyntax = (syntax: string) => {
        isAppendingSyntax.current = true;
        setInputValue(prev => `${prev.trim()} ${syntax} `);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleTagsSave = (newTags: string[]) => {
        setTags(newTags);
        setActivePopover(null);
    }
    
    const priorityPillColors: Record<Priority, string> = {
        [Priority.HIGH]: 'bg-red-900/80 text-red-300',
        [Priority.MEDIUM]: 'bg-yellow-900/80 text-yellow-300',
        [Priority.LOW]: 'bg-blue-900/80 text-blue-300',
        [Priority.NONE]: '',
    };
    const genericPillColor = "bg-background-tertiary text-content-secondary";
        
    const priorityOptions = [
        { level: Priority.HIGH, color: 'text-red-500' },
        { level: Priority.MEDIUM, color: 'text-yellow-500' },
        { level: Priority.LOW, color: 'text-blue-500' },
        { level: Priority.NONE, color: 'text-content-tertiary' },
    ];
    
    const priorityIconColors: Record<Priority, string> = {
        [Priority.HIGH]: 'text-red-500',
        [Priority.MEDIUM]: 'text-yellow-500',
        [Priority.LOW]: 'text-blue-500',
        [Priority.NONE]: 'text-content-secondary',
    };

    const formattedDueDate = dueDate ? dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Date';

    return (
        <div className="px-4 bg-background-primary">
            <div ref={formRef} onFocus={() => setIsFocused(true)} onBlur={handleBlur} className={`bg-background-secondary rounded-lg border-2 transition-all ${isFocused ? 'border-primary shadow-lg' : 'border-transparent'}`}>
                <div className="px-2">
                    <form onSubmit={handleSubmit} className="flex items-center">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isFocused ? "What would you like to do?" : "+ Add task"}
                            className="w-full bg-transparent text-content-primary placeholder-content-secondary focus:outline-none px-2 py-3"
                        />
                    </form>

                    {(tags.length > 0 || priority !== Priority.NONE || dueDate || listInfo) && (
                        <div className="flex items-center flex-wrap gap-1 px-2">
                            {priority !== Priority.NONE && (
                                <Pill colorClass={priorityPillColors[priority]} onRemove={() => setPriority(Priority.NONE)}>
                                    !{priority}
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
                
                <AnimatePresence>
                    {isFocused && (
                        // @ts-ignore
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center justify-between overflow-hidden px-2 pt-2">
                            <div className="flex items-center space-x-1">
                                <button ref={dateTriggerRef} type="button" onClick={() => setActivePopover('date')} className={`flex items-center space-x-1 text-sm px-2 py-1 rounded hover:bg-background-tertiary ${dueDate ? 'text-primary bg-primary/10' : 'text-content-secondary'}`}>
                                    <CalendarIcon className="h-4 w-4"/>
                                    <span>{formattedDueDate}</span>
                                </button>
                                <button ref={priorityTriggerRef} type="button" onClick={() => setActivePopover('priority')} className={`p-2 rounded hover:bg-background-tertiary ${priorityIconColors[priority]}`}><FlagSolidIcon className="h-4 w-4"/></button>
                                <button ref={tagTriggerRef} type="button" onClick={() => setActivePopover('tag')} className={`p-2 rounded hover:bg-background-tertiary ${tags.length > 0 ? 'text-primary' : 'text-content-secondary'}`}><TagIcon className="h-4 w-4"/></button>
                                <button ref={listTriggerRef} type="button" onClick={() => setActivePopover('list')} className="p-2 rounded text-content-secondary hover:bg-background-tertiary"><MoveToListIcon className="h-4 w-4"/></button>
                                <button ref={moreTriggerRef} type="button" onClick={() => setActivePopover('more')} className="p-2 rounded text-content-secondary hover:bg-background-tertiary"><MoreIcon className="h-4 w-4"/></button>
                            </div>
                            <button type="button" onClick={() => handleSubmit()} className="px-4 py-1.5 text-sm bg-primary text-white rounded-md font-semibold hover:bg-primary-focus">Add</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <Popover isOpen={activePopover === 'date'} onClose={() => setActivePopover(null)} triggerRef={dateTriggerRef} position="bottom-start">
                 <div className="bg-background-tertiary rounded-lg shadow-xl border border-border-primary text-content-primary">
                    <DatePickerPopover selectedDate={dueDate} onDateChange={(date) => { setDueDate(date); setActivePopover(null); inputRef.current?.focus(); }} onClose={() => setActivePopover(null)} />
                 </div>
            </Popover>
            <Popover isOpen={activePopover === 'priority'} onClose={() => setActivePopover(null)} triggerRef={priorityTriggerRef} position="bottom-start">
                 <div className="w-48 bg-background-tertiary rounded-lg shadow-xl border border-border-primary p-2 text-content-primary">
                    {priorityOptions.map(opt => (
                        <button key={opt.level} onClick={() => { setPriority(opt.level); setActivePopover(null); }} className={`w-full text-left flex items-center p-2 rounded hover:bg-background-primary ${priority === opt.level ? 'bg-primary/20' : ''}`}>
                            <FlagSolidIcon className={`mr-2 h-5 w-5 ${opt.color}`} />
                            <span>{opt.level}</span>
                            {priority === opt.level && <span className="ml-auto text-primary">✓</span>}
                        </button>
                    ))}
                </div>
            </Popover>
            <Popover isOpen={activePopover === 'tag'} onClose={() => setActivePopover(null)} triggerRef={tagTriggerRef} position="bottom-start">
                 <TagPopoverContent initialTags={tags} onSave={handleTagsSave} onClose={() => setActivePopover(null)} allTags={allTags} onAddTag={handleAddTag} />
            </Popover>
             <Popover isOpen={activePopover === 'list'} onClose={() => { setActivePopover(null); setHoveredListId(null); }} triggerRef={listTriggerRef} position="bottom-start">
                 <div className="w-64 bg-background-tertiary rounded-lg shadow-xl border border-border-primary text-content-primary max-h-60 flex flex-col p-2" onMouseLeave={() => setHoveredListId(null)}>
                     {lists.map(l => {
                        const sections = sectionsByList[l.id] || [];
                        return (
                            <div key={l.id} className="relative">
                                {/* FIX: Corrected ref callback to not return a value. */}
                                <button ref={el => { listSubmenuRefs.current[l.id] = el; }} onMouseEnter={() => setHoveredListId(l.id)} onClick={() => { setListInfo({listId: l.id, listName: l.name}); setActivePopover(null); }} className={`w-full text-left flex items-center justify-between p-2 rounded hover:bg-background-primary`}>
                                <div className="flex items-center">
                                    <span>{l.emoji}</span> <span className="ml-2">{l.name}</span>
                                </div>
                                {sections.length > 0 && <ChevronRightIcon className="h-4 w-4 text-content-tertiary"/>}
                                </button>
                            </div>
                        )
                    })}
                     {hoveredListId && sectionsByList[hoveredListId] && sectionsByList[hoveredListId].length > 0 && (
                        <Popover isOpen={true} onClose={() => {}} triggerRef={{ current: listSubmenuRefs.current[hoveredListId] }} position="right-start" className="ml-1">
                             <div className="w-64 bg-background-tertiary rounded-lg shadow-2xl border border-border-primary text-content-primary p-2">
                                <p className="text-xs px-2 pb-1 text-content-tertiary">{lists.find(l=>l.id===hoveredListId)?.name} Sections</p>
                                {sectionsByList[hoveredListId].map(section => (
                                    <button key={section.id} onClick={() => { setListInfo({listId: section.listId, listName: section.listId}); setActivePopover(null); }} className="w-full text-left p-2 rounded hover:bg-background-primary text-sm">
                                        {section.title}
                                    </button>
                                ))}
                            </div>
                        </Popover>
                    )}
                </div>
            </Popover>
            <Popover isOpen={activePopover === 'more'} onClose={() => setActivePopover(null)} triggerRef={moreTriggerRef} position="bottom-start">
                <div className="w-64 bg-background-tertiary rounded-lg shadow-xl border border-border-primary text-content-primary p-2">
                    <button className="w-full text-left flex items-center p-2 rounded hover:bg-background-primary"><AttachmentIcon className="mr-2 h-4 w-4"/> Attachment</button>
                    <button className="w-full text-left flex items-center p-2 rounded hover:bg-background-primary"><TemplateIcon className="mr-2 h-4 w-4"/> Add from Template</button>
                    <div className="border-t border-border-primary my-1"></div>
                    <button onClick={() => {setIsStyleModalOpen(true); setActivePopover(null);}} className="w-full text-left flex items-center p-2 rounded hover:bg-background-primary"><SettingsIcon className="mr-2 h-4 w-4"/> Input Box Setting</button>
                </div>
            </Popover>
            <InputStyleSettingModal isOpen={isStyleModalOpen} onClose={() => setIsStyleModalOpen(false)} onSettingsChange={onSettingsChange} currentStyle={settings.taskInputStyle} />
        </div>
    );
};