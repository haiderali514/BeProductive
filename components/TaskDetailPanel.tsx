import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Priority, Task, List, Subtask, PomodoroSession } from '../types';
import { PRIORITY_BG_COLORS } from '../constants';
import { MoreIcon, TrashIcon, TasksIcon, StarIcon, CommentIcon, PlusCircleIcon, SubtaskIcon, LinkParentIcon, WontDoIcon, TagIcon, AttachmentIcon, PomodoroIcon, TaskActivitiesIcon, TemplateIcon, DuplicateIcon, CopyLinkIcon, StickyNoteIcon, ConvertToNoteIcon, PrintIcon, ChevronRightIcon, FlagIcon, TextFormatIcon, HeadingIcon, BulletedListIcon, CheckItemIcon, QuoteIcon, DescriptionModeIcon, ChecklistModeIcon, TomorrowIcon } from './Icons';
import { Checkbox } from './Checkbox';
import { Popover } from './Popover';
import { DateTimePickerPopover } from './DateTimePickerPopover';

// ====================================================================
// TaskDetailPanel Component
// ====================================================================
interface TaskDetailPanelProps {
    task: Task;
    tasks: Task[];
    lists: List[];
    pomodoroSessions: PomodoroSession[];
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    onDeleteTask: (taskId: string) => void;
    onAddSubtask: (taskId: string, subtaskTitle: string) => void;
    onToggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
    onReorderTask: (draggedTaskId: string, targetId: string) => void;
}


export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ task, tasks, lists, pomodoroSessions, onUpdateTask, onDeleteTask, onAddSubtask, onToggleSubtaskComplete, onReorderTask }) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [newSubtask, setNewSubtask] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isFocusSubmenuOpen, setFocusSubmenuOpen] = useState(false);
    const [isCommenting, setIsCommenting] = useState(false);
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
    const [isPriorityPopoverOpen, setPriorityPopoverOpen] = useState(false);
    const [isListPopoverOpen, setListPopoverOpen] = useState(false);
    const [isSectionPopoverOpen, setSectionPopoverOpen] = useState(false);
    const [isFormatBarOpen, setFormatBarOpen] = useState(false);

    const [contentView, setContentView] = useState<'description' | 'checklist'>(task.subtasks.length > 0 ? 'checklist' : 'description');

    
    const subtaskInputRef = useRef<HTMLInputElement>(null);
    const menuTriggerRef = useRef<HTMLButtonElement>(null);
    const dateTriggerRef = useRef<HTMLButtonElement>(null);
    const priorityTriggerRef = useRef<HTMLButtonElement>(null);
    const listTriggerRef = useRef<HTMLButtonElement>(null);
    const sectionTriggerRef = useRef<HTMLButtonElement>(null);

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
    
    const currentSection = useMemo(() => {
        const allTasksInOrder = tasks; // We get the full ordered list now
        const taskIndex = allTasksInOrder.findIndex(t => t.id === task.id);
        
        if (taskIndex === -1 || task.isSection) return null;

        for (let i = taskIndex - 1; i >= 0; i--) {
            const potentialSection = allTasksInOrder[i];
            if (potentialSection.isSection && potentialSection.listId === task.listId) {
                return potentialSection;
            }
        }
        return null;
    }, [tasks, task.id, task.listId, task.isSection]);

    const sectionsInList = useMemo(() => {
        return tasks.filter(t => t.isSection && t.listId === task.listId);
    }, [tasks, task.listId]);

    const handleSectionChange = (newSectionId: string | 'no-section') => {
        if (newSectionId === 'no-section') {
            const firstTaskInList = tasks.find(t => t.listId === task.listId);
            if (firstTaskInList && firstTaskInList.id !== task.id) {
                 // By targeting the first task in the list, we move this task to the top,
                 // effectively placing it in the "No Section" area.
                onReorderTask(task.id, firstTaskInList.id);
            }
        } else {
            // The reorder logic correctly handles dropping a task "on" a section header
            // by placing it at the end of that section's tasks.
            onReorderTask(task.id, newSectionId);
        }
        setSectionPopoverOpen(false);
    };

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
            const date = new Date(task.dueDate.replace(' ', 'T'));
            if (isNaN(date.getTime())) {
                return task.dueDate; // Show raw string if not a valid date
            }
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'});
        } catch (e) {
            return task.dueDate; // Fallback to raw string
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
                    <DateTimePickerPopover
                        isOpen={isDatePopoverOpen}
                        onClose={() => setIsDatePopoverOpen(false)}
                        triggerRef={dateTriggerRef}
                        initialValue={task}
                        onSave={(result) => onUpdateTask(task.id, result)}
                    />
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
                        className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md hover:bg-background-tertiary transition-colors ${
                            task.priority !== Priority.NONE 
                                ? PRIORITY_BG_COLORS[task.priority] 
                                : 'bg-background-tertiary text-content-secondary'
                        }`}
                        aria-label="Set priority"
                    >
                        <FlagIcon className="h-4 w-4" />
                        <span>{task.priority !== Priority.NONE ? task.priority : 'Priority'}</span>
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
                 <div className="flex items-center">
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

                    {sectionsInList.length > 0 && !task.isSection && (
                        <>
                            <span className="text-content-tertiary mx-1">/</span>
                            <button ref={sectionTriggerRef} onClick={() => setSectionPopoverOpen(p => !p)} className="text-sm text-content-secondary hover:bg-background-tertiary px-3 py-1.5 rounded-md transition-colors">
                                {currentSection?.title || 'No Section'}
                            </button>
                            <Popover isOpen={isSectionPopoverOpen} onClose={() => setSectionPopoverOpen(false)} triggerRef={sectionTriggerRef} position="top-start">
                                <div className="min-w-[200px] bg-background-tertiary rounded-lg shadow-2xl border border-border-primary text-content-primary p-2">
                                    <button onClick={() => handleSectionChange('no-section')} className={`w-full text-left flex items-center p-2 rounded hover:bg-background-primary ${!currentSection ? 'bg-primary/20' : ''}`}>
                                        No Section
                                        {!currentSection && <span className="ml-auto text-primary">✓</span>}
                                    </button>
                                    {sectionsInList.map(section => (
                                        <button key={section.id} onClick={() => handleSectionChange(section.id)} className={`w-full text-left flex items-center p-2 rounded hover:bg-background-primary ${currentSection?.id === section.id ? 'bg-primary/20' : ''}`}>
                                            {section.title}
                                            {currentSection?.id === section.id && <span className="ml-auto text-primary">✓</span>}
                                        </button>
                                    ))}
                                </div>
                            </Popover>
                        </>
                    )}
                </div>
                <div className="flex items-center space-x-1 text-content-secondary">
                    <button onClick={() => setFormatBarOpen(p => !p)} className="p-2 hover:text-primary rounded-full hover:bg-background-tertiary" title="Formatting"><TextFormatIcon className="w-5 h-5"/></button>
                    <button onClick={() => setIsCommenting(c => !c)} className="p-2 hover:text-primary rounded-full hover:bg-background-tertiary" title="Add Comment"><CommentIcon className="w-5 h-5"/></button>
                    <button ref={menuTriggerRef} onClick={() => setIsMenuOpen(p => !p)} className="p-2 text-content-secondary rounded-full hover:bg-background-tertiary"><MoreIcon className="w-5 h-5"/></button>
                     <Popover isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} triggerRef={menuTriggerRef} position="top-end">
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
            </footer>
        </div>
    );
};