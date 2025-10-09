import React, { useState, useRef, useEffect, useMemo } from 'react';
import { List, Priority, AddTaskFormProps, Task } from '../types';
import { MagicIcon, CalendarIcon, FlagIcon, TagIcon, MoveToListIcon, MoreIcon, AttachmentIcon, TemplateIcon, SettingsIcon, AIAssistantIcon, MoonIcon, ChevronRightIcon } from './Icons';
import { Popover } from './Popover';
import { useTaskForm } from '../hooks/useTaskForm';
import { useData } from '../contexts/DataContext';

export const DatePickerPopover: React.FC<{
    selectedDate: Date | null;
    onDateChange: (date: Date | null) => void;
    onClose: () => void;
}> = ({ selectedDate, onDateChange, onClose }) => {
    const [view, setView] = useState<'date' | 'duration'>('date');
    const [viewDate, setViewDate] = useState(selectedDate || new Date());

    const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

    const changeMonth = (offset: number) => {
        setViewDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(1);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };
    
    const setQuickDate = (offset: number) => {
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + offset);
        onDateChange(newDate);
    };

    const handleDayClick = (day: number) => {
        const newDate = new Date(viewDate);
        newDate.setDate(day);
        onDateChange(newDate);
    };
    
    const quickSelects = [
        { label: 'Today', icon: <AIAssistantIcon className="w-5 h-5"/>, action: () => setQuickDate(0) },
        { label: 'Tomorrow', icon: <SettingsIcon className="w-5 h-5"/>, action: () => setQuickDate(1) },
        { label: 'Next Week', icon: <CalendarIcon className="w-5 h-5"/>, action: () => setQuickDate(7) },
        { label: 'This Weekend', icon: <MoonIcon className="w-5 h-5"/>, action: () => {} }, // Logic for this weekend is more complex, placeholder action
    ];

    return (
        <div className="p-4 w-80">
            <div className="flex space-x-1 bg-background-primary p-1 rounded-lg mb-4">
                <button onClick={() => setView('date')} className={`w-1/2 py-1.5 rounded-md text-sm font-semibold ${view === 'date' ? 'bg-background-secondary' : 'hover:bg-[#2f2f2f]'}`}>Date</button>
                <button onClick={() => setView('duration')} className={`w-1/2 py-1.5 rounded-md text-sm font-semibold ${view === 'duration' ? 'bg-background-secondary' : 'hover:bg-[#2f2f2f]'}`}>Duration</button>
            </div>
            
            <div className="grid grid-cols-4 gap-2 mb-4">
                {quickSelects.map(item => (
                    <button key={item.label} onClick={item.action} className="flex flex-col items-center p-2 rounded-lg bg-background-primary hover:bg-[#2f2f2f] space-y-1">
                        {item.icon}
                        <span className="text-xs">{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="flex justify-between items-center mb-2">
                <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-[#2f2f2f] text-content-secondary">&lt;</button>
                <div className="font-bold text-content-primary">{monthName}</div>
                <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-[#2f2f2f] text-content-secondary">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-content-tertiary mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === viewDate.getMonth() && selectedDate.getFullYear() === viewDate.getFullYear();
                    return (
                        <button key={day} onClick={() => handleDayClick(day)} className={`w-8 h-8 rounded-full text-sm hover:bg-[#2f2f2f] transition-colors ${isSelected ? 'bg-primary text-white' : ''}`}>
                            {day}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-border-primary space-y-2 text-sm text-content-primary">
                <div className="flex justify-between items-center p-2 rounded hover:bg-[#2f2f2f] cursor-pointer"><span>Time</span><span className="text-content-tertiary">&gt;</span></div>
                <div className="flex justify-between items-center p-2 rounded hover:bg-[#2f2f2f] cursor-pointer"><span>Reminder</span><span className="text-content-tertiary">&gt;</span></div>
                <div className="flex justify-between items-center p-2 rounded hover:bg-[#2f2f2f] cursor-pointer"><span>Repeat</span><span className="text-content-tertiary">&gt;</span></div>
            </div>
            <div className="flex justify-end mt-4 space-x-2">
                <button onClick={() => { onDateChange(null); onClose(); }} className="px-4 py-1.5 text-sm rounded-md hover:bg-[#2f2f2f]">Clear</button>
                <button onClick={onClose} className="px-4 py-1.5 text-sm rounded-md bg-primary text-white hover:bg-primary-focus">OK</button>
            </div>
        </div>
    );
};

const ListSelectionPopover: React.FC<{
    lists: List[];
    tasks: Task[];
    onSelect: (listSyntax: string) => void;
    onClose: () => void;
}> = ({ lists, tasks, onSelect, onClose }) => {
    const [hoveredListId, setHoveredListId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const sectionsByListId = useMemo(() => {
        const result: Record<string, Task[]> = {};
        for (const task of tasks) {
            if (task.isSection && task.listId) {
                if (!result[task.listId]) result[task.listId] = [];
                result[task.listId].push(task);
            }
        }
        return result;
    }, [tasks]);

    const filteredLists = useMemo(() => 
        lists.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [lists, searchTerm]);

    const hoveredListSections = hoveredListId ? sectionsByListId[hoveredListId] : null;

    return (
        <div className="flex">
            <div className="p-2 w-56 flex flex-col">
                <input 
                    type="text" 
                    placeholder="Search" 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-background-primary px-2 py-1.5 rounded border border-border-primary mb-2 text-sm"
                />
                <div className="max-h-52 overflow-y-auto">
                    {filteredLists.map(list => {
                        const sections = sectionsByListId[list.id];
                        return (
                            <button
                                key={list.id}
                                onClick={() => { onSelect(`~${list.name}`); onClose(); }}
                                onMouseEnter={() => setHoveredListId(list.id)}
                                className="w-full text-left flex items-center justify-between p-2 rounded hover:bg-[#2f2f2f]"
                            >
                                <div className="flex items-center space-x-2">
                                    <span>{list.emoji || '•'}</span>
                                    <span className="truncate">{list.name}</span>
                                </div>
                                {sections && sections.length > 0 && <ChevronRightIcon className="w-4 h-4 text-content-tertiary" />}
                            </button>
                        )
                    })}
                </div>
            </div>
            {hoveredListSections && hoveredListSections.length > 0 && (
                 <div className="p-2 w-56 max-h-60 overflow-y-auto border-l border-border-primary">
                    {hoveredListSections.map(section => {
                        const listName = lists.find(l => l.id === section.listId)?.name;
                        return (
                             <button
                                key={section.id}
                                onClick={() => { onSelect(`~${listName}/${section.title}`); onClose(); }}
                                className="w-full text-left flex items-center p-2 rounded hover:bg-[#2f2f2f]"
                            >
                                <span className="truncate">{section.title}</span>
                             </button>
                        );
                    })}
                 </div>
            )}
        </div>
    );
};


type ActivePopoverType = 'date' | 'priority' | 'list' | 'tags' | 'more';

const Pill: React.FC<{ children: React.ReactNode; colorClass: string; onRemove: () => void; }> = ({ children, colorClass, onRemove }) => (
    <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded ${colorClass}`}>
        <span>{children}</span>
        <button onClick={onRemove} type="button" className="ml-1.5 -mr-0.5 p-0.5 rounded-full hover:bg-black/20 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
    </div>
);


export const SmartAddTaskForm: React.FC<AddTaskFormProps> = ({ lists, onAddTask, aiEnabled, activeListId, logApiCall, onSettingsChange, onDeactivate, autoFocus }) => {
    const { tasks } = useData();
    const {
        title, dueDate, priority, selectedListId, tags, listPillLabel, isLoading, error,
        setTitle, setDueDate, setPriority, setSelectedListId, setTags, setListPillLabel, handleSubmit, resetForm
    } = useTaskForm({ lists, onAddTask, aiEnabled, activeListId, logApiCall, onDeactivate });
    
    const [availableTags, setAvailableTags] = useState(['Priority', 'Tutorial', 'Practice', 'Work', 'Analyzation', 'JobMernStack', 'Freelancing', 'Youtube']);
    const [activePopover, setActivePopover] = useState<ActivePopoverType | null>(null);
    const [isFocused, setIsFocused] = useState(autoFocus);

    const formRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
            setIsFocused(true);
        }
    }, [autoFocus]);

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        if (!formRef.current?.contains(e.relatedTarget as Node)) {
             if (!title.trim() && tags.length === 0 && priority === Priority.NONE && !dueDate) {
                setIsFocused(false);
                onDeactivate();
            }
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;

        const priorityMatch = value.match(/!(\bhigh\b|\bmedium\b|\blow\b)\s$/i);
        if (priorityMatch) {
            const p = priorityMatch[1].toLowerCase();
            if (p === 'high') setPriority(Priority.HIGH);
            else if (p === 'medium') setPriority(Priority.MEDIUM);
            else if (p === 'low') setPriority(Priority.LOW);
            value = value.replace(priorityMatch[0], '');
        }

        const tagMatch = value.match(/#([\w-]+)\s$/);
        if (tagMatch) {
            const newTag = tagMatch[1];
            if (!tags.includes(newTag)) setTags(prev => [...prev, newTag]);
            if (!availableTags.includes(newTag)) setAvailableTags(prev => [...prev, newTag]);
            value = value.replace(tagMatch[0], '');
        }

        const listMatch = value.match(/~(\S+)\s$/);
        if (listMatch) {
            const listPath = listMatch[1];
            const listName = listPath.split('/')[0];
            const foundList = lists.find(l => l.name.toLowerCase() === listName.toLowerCase());
            if (foundList) {
                setSelectedListId(foundList.id);
                setListPillLabel(listPath);
                value = value.replace(listMatch[0], '');
            }
        }

        setTitle(value);
    };

    const appendSyntaxAndFocus = (syntax: string) => {
        setTitle(prev => `${prev.trim()}${prev.trim() ? ' ' : ''}${syntax} `);
        inputRef.current?.focus();
        setActivePopover(null);
    };

    const handleSwitchStyle = (e: React.MouseEvent) => {
        e.preventDefault(); 
        onSettingsChange({ taskInputStyle: 'simple' });
        setActivePopover(null);
    };
    
    const triggerRefs = {
        date: useRef<HTMLButtonElement>(null),
        priority: useRef<HTMLButtonElement>(null),
        list: useRef<HTMLButtonElement>(null),
        tags: useRef<HTMLButtonElement>(null),
        more: useRef<HTMLButtonElement>(null),
    };

    const priorityOptions = [
        { level: Priority.HIGH, color: 'text-red-500' },
        { level: Priority.MEDIUM, color: 'text-yellow-500' },
        { level: Priority.LOW, color: 'text-blue-500' },
        { level: Priority.NONE, color: 'text-content-tertiary' },
    ];

    const togglePopover = (popover: ActivePopoverType) => setActivePopover(p => p === popover ? null : popover);
    const closePopover = () => setActivePopover(null);
    
    const dueDateText = dueDate ? dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Today';
    
    const priorityPillColors: Record<Priority, string> = {
        [Priority.HIGH]: 'bg-red-900/80 text-red-300',
        [Priority.MEDIUM]: 'bg-yellow-900/80 text-yellow-300',
        [Priority.LOW]: 'bg-blue-900/80 text-blue-300',
        [Priority.NONE]: '',
    };
    
    const defaultList = lists.find(l => l.id === activeListId);
    const selectedList = lists.find(l => l.id === selectedListId);

    const renderPopoverContent = () => {
        switch (activePopover) {
            case 'date':
                return <DatePickerPopover selectedDate={dueDate} onDateChange={setDueDate} onClose={closePopover} />;
            case 'priority':
                return (
                    <div className="p-2">
                        {priorityOptions.filter(opt => opt.level !== Priority.NONE).map(opt => (
                            <button key={opt.level} onClick={() => appendSyntaxAndFocus(`!${opt.level.toLowerCase()}`)} className="w-full text-left flex items-center p-2 rounded hover:bg-[#2f2f2f]">
                                <FlagIcon className={`mr-2 h-5 w-5 ${opt.color}`} />
                                <span>{opt.level}</span>
                            </button>
                        ))}
                    </div>
                );
            case 'list':
                return <ListSelectionPopover lists={lists} tasks={tasks} onSelect={appendSyntaxAndFocus} onClose={closePopover} />;
            case 'tags':
                 return (
                    <div className="p-2">
                        <div className="max-h-36 overflow-y-auto">
                            {availableTags.map(tag => (
                                <button key={tag} onClick={() => appendSyntaxAndFocus(`#${tag}`)} className="w-full text-left flex items-center p-2 rounded hover:bg-[#2f2f2f]">
                                    <TagIcon className="mr-2 h-5 w-5" />
                                    <span>{tag}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'more':
                return (
                    <div className="p-2">
                        <button className="w-full text-left flex items-center p-2 rounded hover:bg-[#2f2f2f]"><AttachmentIcon className="mr-2"/> Attachment</button>
                        <button className="w-full text-left flex items-center p-2 rounded hover:bg-[#2f2f2f]"><TemplateIcon className="mr-2"/> Add from Template</button>
                         <div className="my-1 border-t border-border-primary"></div>
                        <button onMouseDown={handleSwitchStyle} className="w-full text-left flex items-center p-2 rounded hover:bg-[#2f2f2f]"><SettingsIcon className="mr-2 h-5 w-5"/> Switch to Simple</button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="relative px-4 pt-4 bg-background-primary">
            <div ref={formRef} onBlur={handleBlur} className={`${isFocused ? 'bg-background-primary' : 'bg-background-secondary'} p-2 rounded-lg transition-colors border ${isFocused ? 'border-primary' : 'border-transparent'}`}>
                <form onSubmit={handleSubmit}>
                     <div className="flex items-start flex-wrap gap-1 px-2 pt-2">
                        {priority !== Priority.NONE && (
                            <Pill colorClass={priorityPillColors[priority]} onRemove={() => setPriority(Priority.NONE)}>
                                !{priority}
                            </Pill>
                        )}
                        {selectedList && selectedList.id !== (defaultList?.id || 'inbox') && (
                             <Pill colorClass="bg-gray-700 text-gray-300" onRemove={() => { setSelectedListId(activeListId); setListPillLabel(null); }}>
                                ~{listPillLabel || selectedList.name}
                            </Pill>
                        )}
                        {tags.map(tag => (
                            <Pill key={tag} colorClass="bg-purple-900/80 text-purple-300" onRemove={() => setTags(t => t.filter(x => x !== tag))}>
                                #{tag}
                            </Pill>
                        ))}
                        <input
                            ref={inputRef}
                            onFocus={() => setIsFocused(true)}
                            type="text"
                            value={title}
                            onChange={handleTitleChange}
                            placeholder={aiEnabled ? "What would you like to do?" : "Add a task"}
                            className="flex-1 min-w-[150px] bg-transparent text-content-primary placeholder-content-secondary focus:outline-none"
                        />
                    </div>
                    <div className="flex items-center justify-between mt-1 flex-wrap gap-2">
                        <div className="flex items-center space-x-0.5">
                            <button 
                                ref={triggerRefs.date} 
                                type="button" 
                                onClick={() => togglePopover('date')} 
                                className={`transition-colors flex items-center text-sm px-2 py-1.5 rounded ${
                                    activePopover === 'date' ? 'bg-primary/20 text-primary' : 
                                    dueDate ? 'bg-primary/20 text-primary' : 
                                    'hover:bg-background-tertiary text-content-secondary'
                                }`}
                            >
                                <CalendarIcon className="h-4 w-4 mr-1"/> {dueDateText}
                            </button>
                            <button ref={triggerRefs.priority} type="button" onClick={() => togglePopover('priority')} className={`p-1.5 rounded transition-colors ${activePopover === 'priority' ? 'bg-primary/20 text-primary' : 'hover:bg-background-tertiary text-content-secondary'}`}><FlagIcon /></button>
                            <button ref={triggerRefs.tags} type="button" onClick={() => togglePopover('tags')} className={`p-1.5 rounded transition-colors ${activePopover === 'tags' ? 'bg-primary/20 text-primary' : 'hover:bg-background-tertiary text-content-secondary'}`}><TagIcon /></button>
                            <button ref={triggerRefs.list} type="button" onClick={() => togglePopover('list')} className={`p-1.5 rounded transition-colors ${activePopover === 'list' ? 'bg-primary/20 text-primary' : 'hover:bg-background-tertiary text-content-secondary'}`}><MoveToListIcon /></button>
                            <button ref={triggerRefs.more} type="button" onClick={() => togglePopover('more')} className={`p-1.5 rounded transition-colors ${activePopover === 'more' ? 'bg-primary/20 text-primary' : 'hover:bg-background-tertiary text-content-secondary'}`}><MoreIcon className="h-5 w-5"/></button>
                        </div>
                        <button type="submit" disabled={!title.trim() || isLoading} className="px-4 py-1.5 bg-primary text-white rounded font-semibold text-sm w-20 hover:bg-primary-focus disabled:bg-background-tertiary disabled:text-content-tertiary disabled:cursor-not-allowed">
                            {isLoading ? "..." : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
            {error && <p className="text-red-500 text-xs mt-2 text-center absolute bottom-full left-1/2 -translate-x-1/2 w-full p-1">{error}</p>}
            <Popover isOpen={activePopover !== null} onClose={closePopover} triggerRef={activePopover ? triggerRefs[activePopover] : null} position="bottom-start">
                 <div className="bg-[#242424] rounded-lg shadow-2xl border border-border-primary text-white">
                    {renderPopoverContent()}
                 </div>
            </Popover>
        </div>
    );
};