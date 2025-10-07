import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Priority, Task, List, Subtask, PomodoroSession } from '../types';
import { MoreIcon, TrashIcon, TasksIcon, StarIcon, CommentIcon, PlusCircleIcon, SubtaskIcon, LinkParentIcon, WontDoIcon, TagIcon, AttachmentIcon, PomodoroIcon, TaskActivitiesIcon, TemplateIcon, DuplicateIcon, CopyLinkIcon, StickyNoteIcon, ConvertToNoteIcon, PrintIcon, ChevronRightIcon, FlagIcon, TextFormatIcon, HeadingIcon, BulletedListIcon, CheckItemIcon, QuoteIcon, DescriptionModeIcon, ChecklistModeIcon } from './Icons';
import { PRIORITY_COLORS } from '../constants';
import { Checkbox } from './Checkbox';
import { Popover } from './Popover';

// ====================================================================
// Calendar Popover Component (for TaskDetailPanel)
// ====================================================================
const CalendarPopoverContent: React.FC<{
    selectedDate: Date | null;
    onDateChange: (date: Date | null) => void;
    onClose: () => void;
}> = ({ selectedDate, onDateChange, onClose }) => {
    const [viewDate, setViewDate] = useState(selectedDate || new Date());

    const monthName = viewDate.toLocaleString('default', { month: 'long' });
    const year = viewDate.getFullYear();
    const daysInMonth = new Date(year, viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, viewDate.getMonth(), 1).getDay(); // 0 = Sunday

    const changeMonth = (offset: number) => {
        setViewDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(1); // Avoid issues with differing month lengths
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };

    const handleDayClick = (day: number) => {
        const newDate = new Date(viewDate);
        newDate.setDate(day);
        onDateChange(newDate);
    };

    return (
        <div className="p-4 w-72 bg-background-tertiary rounded-lg shadow-2xl border border-border-primary text-content-primary">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-background-secondary text-content-secondary">&lt;</button>
                <div className="font-bold text-content-primary">{monthName} {year}</div>
                <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-background-secondary text-content-secondary">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-content-tertiary mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const isSelected = selectedDate ? (
                        selectedDate.getDate() === day &&
                        selectedDate.getMonth() === viewDate.getMonth() &&
                        selectedDate.getFullYear() === viewDate.getFullYear()
                    ) : false;
                    return (
                        <button key={day} onClick={() => handleDayClick(day)} className={`w-8 h-8 rounded-full text-sm hover:bg-background-secondary transition-colors ${isSelected ? 'bg-primary text-white' : ''}`}>
                            {day}
                        </button>
                    );
                })}
            </div>
             <div className="mt-4 pt-4 border-t border-border-primary space-y-2 text-sm text-content-primary">
                <div className="flex justify-between items-center p-2 rounded hover:bg-background-secondary cursor-pointer"><span>Time</span><span className="text-content-tertiary">&gt;</span></div>
                <div className="flex justify-between items-center p-2 rounded hover:bg-background-secondary cursor-pointer"><span>Reminder</span><span className="text-content-tertiary">&gt;</span></div>
                <div className="flex justify-between items-center p-2 rounded hover:bg-background-secondary cursor-pointer"><span>Repeat</span><span className="text-content-tertiary">&gt;</span></div>
            </div>
            <div className="flex justify-end mt-4 space-x-2">
                <button onClick={() => { onDateChange(null); onClose(); }} className="px-4 py-1.5 text-sm rounded-md hover:bg-background-secondary">Clear</button>
                <button onClick={onClose} className="px-4 py-1.5 text-sm rounded-md bg-primary text-white hover:bg-primary-focus">OK</button>
            </div>
        </div>
    );
};


// ====================================================================
// TaskDetailPanel Component
// ====================================================================
interface TaskDetailPanelProps {
    task: Task;
    lists: List[];
    pomodoroSessions: PomodoroSession[];
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    onDeleteTask: (taskId: string) => void;
    onAddSubtask: (taskId: string, subtaskTitle: string) => void;
    onToggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
}


export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ task, lists, pomodoroSessions, onUpdateTask, onDeleteTask, onAddSubtask, onToggleSubtaskComplete }) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [newSubtask, setNewSubtask] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isFocusSubmenuOpen, setFocusSubmenuOpen] = useState(false);
    const [isCommenting, setIsCommenting] = useState(false);
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
    const [isPriorityPopoverOpen, setPriorityPopoverOpen] = useState(false);
    const [isListPopoverOpen, setListPopoverOpen] = useState(false);
    const [isFormatBarOpen, setFormatBarOpen] = useState(false);

    const [contentView, setContentView] = useState<'description' | 'checklist'>(task.subtasks.length > 0 ? 'checklist' : 'description');

    
    const subtaskInputRef = useRef<HTMLInputElement>(null);
    const menuTriggerRef = useRef<HTMLButtonElement>(null);
    const dateTriggerRef = useRef<HTMLButtonElement>(null);
    const priorityTriggerRef = useRef<HTMLButtonElement>(null);
    const listTriggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description || '');
    }, [task]);

    const handleTitleBlur = () => {
        if (title.trim() && title !== task.title) {
            onUpdateTask(task.id, { title: title.trim() });
        } else {
            setTitle(task.title);
        }
    };
    
    const handleDescriptionBlur = () => {
        if (description !== (task.description || '')) {
            onUpdateTask(task.id, { description });
        }
    };

    const handleAddSubtask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSubtask.trim()) {
            onAddSubtask(task.id, newSubtask.trim());
            setNewSubtask('');
        }
    };

    const listName = useMemo(() => lists.find(l => l.id === task.listId)?.name || 'Inbox', [lists, task.listId]);
    
    const focusStats = useMemo(() => {
        const relevantSessions = (pomodoroSessions || []).filter(session => session.taskId === task.id);
        const count = relevantSessions.length;
    
        const totalMs = relevantSessions.reduce((sum, session) => sum + (session.endTime - session.startTime), 0);
        
        if (totalMs === 0) return null;
        
        const hours = Math.floor(totalMs / 3600000);
        const minutes = Math.floor((totalMs % 3600000) / 60000);
        
        if (hours === 0 && minutes === 0) return null;

        return { count, duration: `${hours}h${minutes}m` };
    }, [pomodoroSessions, task.id]);

    const priorityOptions = [
        { level: Priority.HIGH, color: 'text-red-500' },
        { level: Priority.MEDIUM, color: 'text-yellow-500' },
        { level: Priority.LOW, color: 'text-blue-500' },
        { level: Priority.NONE, color: 'text-content-tertiary' },
    ];


    const menuItems = [
        { label: 'Add Subtask', icon: <SubtaskIcon />, action: () => { setContentView('checklist'); subtaskInputRef.current?.focus(); } },
        { label: 'Link Parent Task', icon: <LinkParentIcon />, action: () => console.log('Link Parent Task') },
        { label: task.pinned ? 'Unpin' : 'Pin', icon: <StarIcon isFilled={task.pinned}/>, action: () => onUpdateTask(task.id, { pinned: !task.pinned }) },
        { label: "Won't Do", icon: <WontDoIcon />, action: () => console.log("Won't Do") },
        { label: 'Tags', icon: <TagIcon />, action: () => console.log("Tags"), hasSubmenu: true },
        { label: 'Upload Attachment', icon: <AttachmentIcon />, action: () => console.log("Upload Attachment") },
    ];
    const moreMenuItems = [
        { label: 'Task Activities', icon: <TaskActivitiesIcon />, action: () => console.log('Task Activities') },
        { label: 'Save as Template', icon: <TemplateIcon />, action: () => console.log('Save as Template') },
        { label: 'Duplicate', icon: <DuplicateIcon />, action: () => console.log('Duplicate') },
        { label: 'Copy Link', icon: <CopyLinkIcon />, action: () => console.log('Copy Link') },
        { label: 'Open as Sticky Note', icon: <StickyNoteIcon />, action: () => console.log('Open as Sticky Note') },
        { label: 'Convert to Note', icon: <ConvertToNoteIcon />, action: () => console.log('Convert to Note') },
        { label: 'Print', icon: <PrintIcon />, action: () => console.log('Print') },
    ];

    const MenuItem: React.FC<{item: {label: string, icon: React.ReactNode, action: () => void, hasSubmenu?: boolean}, onMouseEnter?: () => void}> = ({ item, onMouseEnter }) => (
        <button onClick={() => { item.action(); setIsMenuOpen(false); }} onMouseEnter={onMouseEnter} className="w-full text-left flex items-center justify-between p-2 rounded text-sm hover:bg-[#2f2f2f]">
            <div className="flex items-center space-x-3">
                <span className="w-4 h-4">{item.icon}</span>
                <span>{item.label}</span>
            </div>
            {item.hasSubmenu && <ChevronRightIcon className="h-4 w-4" />}
        </button>
    );

    const formattedDueDate = useMemo(() => {
        if (!task.dueDate) return "Date and Reminder";
        try {
            return new Date(task.dueDate.replace(' ', 'T')).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'});
        } catch (e) {
            return "Date and Reminder";
        }
    }, [task.dueDate]);

    return (
        <div className="bg-background-primary h-full flex flex-col border-l border-border-primary">
            {/* Header */}
            <header className="p-4 flex justify-between items-center border-b border-border-primary flex-shrink-0">
                 <div className="flex items-center space-x-3">
                    <Checkbox checked={task.completed} onChange={() => onUpdateTask(task.id, { completed: !task.completed })} size="lg" variant="square" />
                    <button ref={dateTriggerRef} onClick={() => setIsDatePopoverOpen(p => !p)} className="text-sm text-content-secondary hover:bg-background-tertiary px-3 py-1.5 rounded-md transition-colors">
                        {formattedDueDate}
                    </button>
                    <Popover isOpen={isDatePopoverOpen} onClose={() => setIsDatePopoverOpen(false)} triggerRef={dateTriggerRef}>
                        <CalendarPopoverContent
                            selectedDate={task.dueDate ? new Date(task.dueDate.replace(' ', 'T')) : null}
                            onDateChange={(newDate) => {
                                const newDueDate = newDate ? newDate.toISOString().split('T')[0] : null;
                                onUpdateTask(task.id, { dueDate: newDueDate });
                            }}
                            onClose={() => setIsDatePopoverOpen(false)}
                        />
                    </Popover>
                </div>
                <div className="flex items-center space-x-2">
                    {focusStats && (
                        <div className="text-sm text-blue-400 flex items-center space-x-1 bg-blue-500/10 px-2 py-1 rounded-md">
                            <span>Focused for</span>
                            <span className="font-semibold">{focusStats.count}</span>
                            <span className="font-semibold">{focusStats.duration}</span>
                        </div>
                    )}
                    <button 
                        ref={priorityTriggerRef}
                        onClick={() => setPriorityPopoverOpen(p => !p)}
                        className={`p-2 rounded-full hover:bg-background-tertiary ${task.priority !== Priority.NONE ? PRIORITY_COLORS[task.priority].replace('border-','text-') : 'text-content-secondary'}`}
                        aria-label="Set priority"
                    >
                        <FlagIcon className="h-5 w-5" />
                    </button>
                     <Popover isOpen={isPriorityPopoverOpen} onClose={() => setPriorityPopoverOpen(false)} triggerRef={priorityTriggerRef} position="bottom-end">
                        <div className="w-48 bg-background-tertiary rounded-lg shadow-xl border border-border-primary p-2 text-content-primary">
                            {priorityOptions.map(opt => (
                                <button key={opt.level} onClick={() => { onUpdateTask(task.id, {priority: opt.level}); setPriorityPopoverOpen(false); }} className={`w-full text-left flex items-center p-2 rounded hover:bg-background-primary ${task.priority === opt.level ? 'bg-primary/20' : ''}`}>
                                    <FlagIcon className={`mr-2 h-5 w-5 ${opt.color}`} />
                                    <span>{opt.level}</span>
                                    {task.priority === opt.level && <span className="ml-auto text-primary">✓</span>}
                                </button>
                            ))}
                        </div>
                    </Popover>
                     <button 
                        onClick={() => onUpdateTask(task.id, { pinned: !task.pinned })}
                        className={`p-2 rounded-full hover:bg-background-tertiary ${task.pinned ? 'text-yellow-400' : 'text-content-secondary'}`}
                        aria-label={task.pinned ? 'Unpin task' : 'Pin task'}
                    >
                        <StarIcon className="h-5 w-5" isFilled={task.pinned} />
                    </button>
                    <button ref={menuTriggerRef} onClick={() => setIsMenuOpen(p => !p)} className="p-2 text-content-secondary rounded-full hover:bg-background-tertiary"><MoreIcon className="w-5 h-5"/></button>
                     <Popover isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} triggerRef={menuTriggerRef} position="bottom-end">
                         <div className="w-64 bg-[#242424] rounded-lg shadow-xl border border-border-primary p-2 text-white" onMouseLeave={() => setFocusSubmenuOpen(false)}>
                            {menuItems.map(item => <MenuItem key={item.label} item={item} onMouseEnter={() => setFocusSubmenuOpen(false)} />)}
                            <div className="relative">
                                <MenuItem item={{label: 'Start Focus', icon: <PomodoroIcon />, action: () => {}, hasSubmenu: true}} onMouseEnter={() => setFocusSubmenuOpen(true)} />
                                {isFocusSubmenuOpen && (
                                    <div className="absolute top-0 left-full ml-1 w-48 bg-[#242424] rounded-lg shadow-xl border border-border-primary p-2">
                                        <MenuItem item={{label: 'Start Pomo', icon: <PomodoroIcon/>, action: () => console.log('Start Pomo')}} />
                                        <MenuItem item={{label: 'Start Stopwatch', icon: <PomodoroIcon/>, action: () => console.log('Start Stopwatch')}} />
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-border-primary my-2 mx-[-8px]"></div>
                            {moreMenuItems.map(item => <MenuItem key={item.label} item={item} />)}
                            <div className="border-t border-border-primary my-2 mx-[-8px]"></div>
                            <button onClick={() => {onDeleteTask(task.id); setIsMenuOpen(false);}} className="w-full text-left flex items-center space-x-3 p-2 rounded text-sm text-red-500 hover:bg-red-500/10">
                                <TrashIcon />
                                <span>Delete</span>
                            </button>
                        </div>
                    </Popover>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 relative group">
                 <div className="absolute top-1 right-6 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="relative group">
                        <button
                            onClick={() => setContentView(contentView === 'description' ? 'checklist' : 'description')}
                            className="p-2 rounded-md bg-background-tertiary text-content-secondary hover:bg-border-primary"
                            aria-label={`Switch to ${contentView === 'description' ? 'Checklist' : 'Description'} view`}
                        >
                            {contentView === 'description' ? <ChecklistModeIcon className="w-4 h-4" /> : <DescriptionModeIcon className="w-4 h-4" />}
                        </button>
                        <span className="absolute bottom-full mb-2 w-max px-2 py-1 bg-background-tertiary text-content-primary text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 left-1/2 -translate-x-1/2">
                            {contentView === 'description' ? 'Checklist' : 'Description'}
                        </span>
                    </div>
                 </div>
                <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="w-full bg-transparent text-2xl font-bold text-content-primary focus:outline-none placeholder-content-tertiary"
                    placeholder="Task Title"
                />
                
                {contentView === 'description' ? (
                     <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={handleDescriptionBlur}
                        placeholder="Description"
                        rows={5}
                        className="w-full bg-transparent text-content-primary focus:outline-none placeholder-content-secondary text-sm resize-none leading-relaxed"
                    />
                ) : (
                    <div>
                        {task.subtasks.map(subtask => (
                            <div key={subtask.id} className="flex items-center group p-1.5 -ml-1.5 rounded hover:bg-background-tertiary">
                                <Checkbox checked={subtask.completed} onChange={() => onToggleSubtaskComplete(task.id, subtask.id)} size="sm" variant="square" />
                                <span className={`ml-3 flex-grow text-sm ${subtask.completed ? 'line-through text-content-tertiary' : 'text-content-primary'}`}>{subtask.title}</span>
                            </div>
                        ))}
                        <form onSubmit={handleAddSubtask} className="mt-1 flex items-center group">
                            <PlusCircleIcon className="w-4 h-4 text-content-tertiary group-focus-within:text-primary" />
                            <input
                                ref={subtaskInputRef}
                                type="text"
                                value={newSubtask}
                                onChange={(e) => setNewSubtask(e.target.value)}
                                placeholder="Add Subtask"
                                className="w-full bg-transparent text-content-primary focus:outline-none placeholder-content-secondary text-sm ml-3 border-b-2 border-transparent focus:border-primary transition-colors py-1"
                            />
                        </form>
                    </div>
                )}
                
                 {isCommenting && (
                    <div className="mt-auto pt-4">
                        <textarea
                            placeholder="Write a comment..."
                            rows={3}
                            className="w-full bg-background-primary border border-border-primary rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            autoFocus
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                            <button onClick={() => setIsCommenting(false)} className="px-3 py-1.5 text-sm rounded-md bg-background-tertiary hover:bg-border-primary">Cancel</button>
                            <button className="px-3 py-1.5 text-sm rounded-md bg-primary text-white hover:bg-primary-focus">Comment</button>
                        </div>
                    </div>
                )}

            </div>

             {isFormatBarOpen && (
                <div className="p-2 border-t border-border-primary flex-shrink-0 bg-background-primary flex items-center justify-center space-x-1 text-content-secondary">
                    {[HeadingIcon, BulletedListIcon, CheckItemIcon, QuoteIcon].map((Icon, i) => (
                        <button key={i} className="p-2 hover:text-primary rounded-full hover:bg-background-tertiary"><Icon className="w-5 h-5" /></button>
                    ))}
                </div>
            )}

            {/* Footer */}
            <footer className="p-2 border-t border-border-primary flex-shrink-0 bg-background-secondary flex justify-between items-center">
                <button ref={listTriggerRef} onClick={() => setListPopoverOpen(p => !p)} className="text-sm text-content-secondary hover:bg-background-tertiary px-3 py-1.5 rounded-md transition-colors flex items-center space-x-2">
                    <TasksIcon />
                    <span>{listName}</span>
                </button>
                <Popover isOpen={isListPopoverOpen} onClose={() => setListPopoverOpen(false)} triggerRef={listTriggerRef} position="top-start">
                    <div className="min-w-[200px] bg-background-tertiary rounded-lg shadow-2xl border border-border-primary text-content-primary p-2">
                        {lists.map(list => (
                            <button key={list.id} onClick={() => { onUpdateTask(task.id, {listId: list.id}); setListPopoverOpen(false); }} className={`w-full text-left flex items-center p-2 rounded hover:bg-background-primary ${task.listId === list.id ? 'bg-primary/20' : ''}`}>
                                <span>{list.name}</span>
                                {task.listId === list.id && <span className="ml-auto text-primary">✓</span>}
                            </button>
                        ))}
                    </div>
                </Popover>
                <div className="flex items-center space-x-1 text-content-secondary">
                    <button onClick={() => setFormatBarOpen(p => !p)} className="p-2 hover:text-primary rounded-full hover:bg-background-tertiary" title="Formatting"><TextFormatIcon className="w-5 h-5"/></button>
                    <button onClick={() => setIsCommenting(c => !c)} className="p-2 hover:text-primary rounded-full hover:bg-background-tertiary" title="Add Comment"><CommentIcon className="w-5 h-5"/></button>
                </div>
            </footer>
        </div>
    );
};