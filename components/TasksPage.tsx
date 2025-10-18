import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Priority, Task, List, AddTaskFormProps, Tag, Filter } from '../types';
import { TaskItem } from './TaskItem';
import { DetailedAddTaskForm } from './SmartAddTaskForm';
import { SimpleAddTaskForm } from './SimpleAddTaskForm';
import { PlanWithAIModal } from './PlanWithAIModal';
import { AITaskSuggestion } from '../services/geminiService';
import { useSettings } from '../contexts/SettingsContext';
import { useData } from '../contexts/DataContext';
import { ApiFeature, useApiUsage } from '../hooks/useApiUsage';
import { ResizablePanel } from './ResizablePanel';
import { TaskDetailPanel } from './TaskDetailPanel';
import { TasksSidebar } from './TasksSidebar';
import { MoreIcon, PlusIcon, ChevronDownIcon, LibraryIcon, MatrixIcon, FiltersIcon, CheckItemIcon, HamburgerMenuIcon, SettingsIcon, ShareIcon, AnalyticsIcon, PrintIcon, ChevronRightIcon, MagicIcon, SidebarCollapseIcon, SortIcon, SortByIcon, TimelineIcon, AddSectionAboveIcon, AddSectionBelowIcon, EditIcon, MoveToListIcon, TrashIcon } from './Icons';
import { Popover } from './Popover';
import useLocalStorage from '../hooks/useLocalStorage';
import { ListActivitiesModal } from './ListActivitiesModal';
import { KanbanView } from './KanbanView';
import { CalendarPage } from './CalendarPage';
import { TaskDetailPopover } from './TaskDetailPopover';
import { TimelineView } from './TimelineView';
import { motion, AnimatePresence } from 'framer-motion';
import { smartListsConfig } from '../constants';
import { Settings } from '../hooks/useSettings';

// ====================================================================
// New Section Components
// ====================================================================

const SectionHeader: React.FC<{
    section: Task;
    count: number;
    onToggleCollapse: () => void;
    onDragEnter: () => void;
    onDrop: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    isDropTarget: boolean;
    isDragDisabled?: boolean;
    onAddSection: (name: string, afterTaskId?: string, beforeTaskId?: string) => void;
    onRenameSection: (sectionId: string, newName: string) => void;
    onDeleteSection: (sectionId: string) => void;
    onMoveSection: (sectionId: string, newListId: string) => void;
    onAddTask: (title: string, afterTaskId: string) => void;
    lists: List[];
    settings: Settings;
    onSettingsChange: (newSettings: Partial<Settings>) => void;
    logApiCall: (feature: ApiFeature, tokens: number) => void;
}> = ({ section, count, onToggleCollapse, onDragEnter, onDrop, onDragEnd, isDropTarget, isDragDisabled, onAddSection, onRenameSection, onDeleteSection, onMoveSection, onAddTask, lists, settings, onSettingsChange, logApiCall }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMoveSubmenuOpen, setIsMoveSubmenuOpen] = useState(false);
    const [isAddingTask, setIsAddingTask] = useState(false);
    
    const menuTriggerRef = useRef<HTMLButtonElement>(null);
    const moveSubmenuTriggerRef = useRef<HTMLDivElement>(null);
    const isInboxPrioritySection = section.id.startsWith('inbox-section-');


    const handleRename = () => {
        const newName = prompt('Enter new section name:', section.title);
        if (newName && newName.trim() !== section.title) {
            onRenameSection(section.id, newName.trim());
        }
    };

    const handleAddTaskSubmit = (taskData: Parameters<AddTaskFormProps['onAddTask']>[0]) => {
        if(taskData.title.trim()) {
            onAddTask(taskData.title.trim(), section.id);
        }
        setIsAddingTask(false);
    };

    return (
        <div
            onDragEnter={isDragDisabled ? undefined : onDragEnter}
            onDrop={isDragDisabled ? undefined : onDrop}
            onDragEnd={isDragDisabled ? undefined : onDragEnd}
            onDragOver={isDragDisabled ? undefined : (e) => e.preventDefault()}
            className="relative mt-4 group"
        >
            {isDropTarget && !isDragDisabled && <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-full z-10" />}
            <div className="flex items-center px-1 py-1">
                {!isDragDisabled && !isInboxPrioritySection && (
                    <span className="cursor-grab text-content-tertiary p-1">
                        <HamburgerMenuIcon className="h-4 w-4" />
                    </span>
                )}
                <div className="flex items-center flex-grow cursor-pointer truncate" onClick={isInboxPrioritySection ? undefined : onToggleCollapse}>
                    <ChevronDownIcon className={`h-4 w-4 text-content-tertiary transition-transform ml-1 flex-shrink-0 ${section.isCollapsed ? '-rotate-90' : ''}`} />
                    <h2 className="text-sm font-bold text-content-primary ml-2 truncate">{section.title}</h2>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isInboxPrioritySection && <button onClick={() => setIsAddingTask(true)} className="p-1 rounded-full text-content-tertiary hover:bg-background-primary hover:text-primary"><PlusIcon className="h-5 w-5" /></button>}
                    {!isInboxPrioritySection && <button ref={menuTriggerRef} onClick={() => setIsMenuOpen(o => !o)} className="p-1 rounded-full text-content-tertiary hover:bg-background-primary hover:text-primary"><MoreIcon className="w-4 h-4" /></button>}
                    <span className="text-sm text-content-tertiary w-8 text-right">{count}</span>
                </div>
                 {!isInboxPrioritySection && (
                    <>
                        <Popover isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} triggerRef={menuTriggerRef} position="bottom-end">
                            <div className="w-56 bg-[#2f2f2f] rounded-lg shadow-xl border border-border-primary p-2 text-white text-sm" onMouseLeave={() => setIsMoveSubmenuOpen(false)}>
                                <MenuItem icon={<EditIcon />} label="Rename" onClick={() => { handleRename(); setIsMenuOpen(false); }}/>
                                <MenuItem icon={<AddSectionAboveIcon />} label="Add Section Above" onClick={() => { onAddSection("New Section", undefined, section.id); setIsMenuOpen(false); }}/>
                                <MenuItem icon={<AddSectionBelowIcon />} label="Add Section Below" onClick={() => { onAddSection("New Section", section.id); setIsMenuOpen(false); }}/>
                                <div ref={moveSubmenuTriggerRef} onMouseEnter={() => setIsMoveSubmenuOpen(true)}>
                                    <MenuItem icon={<MoveToListIcon />} label="Move to" hasSubmenu/>
                                </div>
                                <div className="border-t border-border-primary my-1 mx-2"></div>
                                <MenuItem icon={<TrashIcon />} label="Delete" onClick={() => { onDeleteSection(section.id); setIsMenuOpen(false); }}/>
                            </div>
                        </Popover>
                        <Popover isOpen={isMoveSubmenuOpen} onClose={() => {}} triggerRef={moveSubmenuTriggerRef} position="right-start" className="ml-1">
                            <div className="w-48 bg-[#2f2f2f] rounded-lg shadow-xl border border-border-primary p-1 text-white text-sm" onMouseEnter={() => setIsMoveSubmenuOpen(true)} onMouseLeave={() => setIsMoveSubmenuOpen(false)}>
                                {lists.filter(l => l.id !== section.listId && l.id !== 'inbox').map(list => (
                                    <button key={list.id} onClick={() => { onMoveSection(section.id, list.id); setIsMenuOpen(false); setIsMoveSubmenuOpen(false); }} className="w-full text-left p-2 rounded hover:bg-background-tertiary">{list.name}</button>
                                ))}
                            </div>
                        </Popover>
                    </>
                 )}
            </div>
            {isAddingTask && <SimpleAddTaskForm 
                onAddTask={handleAddTaskSubmit} 
                onDeactivate={() => setIsAddingTask(false)}
                autoFocus={true}
                lists={lists} 
                activeListId={section.listId} 
                logApiCall={logApiCall} 
                onSettingsChange={onSettingsChange} 
                settings={settings}
                aiEnabled={settings.enableAIFeatures}
            />}
        </div>
    );
};


const AddSectionInput: React.FC<{
    onAddSection: (name: string) => void;
    onCancel: () => void;
}> = ({ onAddSection, onCancel }) => {
    const [name, setName] = useState('New section');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const handleFinalize = () => {
        onAddSection(name.trim() || 'Untitled Section');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleFinalize();
        }
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div className="px-3 py-1 mt-3 flex items-center border-b-2 border-primary">
             <ChevronDownIcon className={`h-4 w-4 text-content-tertiary}`} />
            <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleFinalize}
                className="ml-2 w-full bg-transparent text-sm font-bold uppercase text-content-primary focus:outline-none"
            />
        </div>
    );
};

const MenuItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    hasSubmenu?: boolean;
    currentValue?: string;
}> = ({ icon, label, onClick, hasSubmenu, currentValue }) => (
    <button onClick={onClick} className="w-full text-left flex items-center justify-between p-2 rounded text-sm hover:bg-[#2f2f2f]">
        <div className="flex items-center space-x-3">
            {icon}
            <span>{label}</span>
        </div>
        <div className="flex items-center space-x-2">
            {currentValue && <span className="text-xs text-content-tertiary">{currentValue}</span>}
            {hasSubmenu && <ChevronRightIcon className="w-4 h-4 text-content-tertiary" />}
        </div>
    </button>
);

const EmptySectionDropzone: React.FC<{
    onDragEnter: () => void;
    onDrop: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    isDropTarget: boolean;
    isDragDisabled?: boolean;
}> = ({ onDragEnter, onDrop, onDragEnd, isDropTarget, isDragDisabled }) => {
    return (
        <div
            onDragEnter={isDragDisabled ? undefined : onDragEnter}
            onDrop={isDragDisabled ? undefined : onDrop}
            onDragEnd={isDragDisabled ? undefined : onDragEnd}
            onDragOver={isDragDisabled ? undefined : (e) => e.preventDefault()}
            className="relative h-10 -mt-1"
        >
            {isDropTarget && !isDragDisabled && (
                <div className="mx-4 h-full border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center transition-all duration-200 animate-fade-in-up">
                    <span className="text-sm text-primary/80">Move to this section</span>
                </div>
            )}
        </div>
    );
};

const DoodlesBackground: React.FC = () => (
    <div
      className="absolute inset-0 z-0 opacity-5 pointer-events-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='296' height='296' viewBox='0 0 296 296' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M44.5 13.5L41 17L44.5 20.5' stroke='%23E0E0E0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M52 24L55.5 20.5L52 17' stroke='%23E0E0E0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M48.5 13V24.5' stroke='%23E0E0E0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M224.5 149.5L221 153L224.5 156.5' stroke='%23E0E0E0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M232 160L235.5 156.5L232 153' stroke='%23E0E0E0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M228.5 149V160.5' stroke='%23E0E0E0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M13.5 212.5L10 216L13.5 219.5' stroke='%23E0E0E0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M21 223L24.5 219.5L21 216' stroke='%23E0E0E0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M17.5 212V223.5' stroke='%23E0E0E0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Crect x='151' y='213' width='88' height='60' rx='8' stroke='%23E0E0E0' stroke-width='2'/%3E%3Cpath d='M163 229H201' stroke='%23E0E0E0' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M163 245H227' stroke='%23E0E0E0' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M260.444 195.833C263.101 195.833 265.222 193.712 265.222 191.056V114.778C265.222 112.121 263.101 110 260.444 110H253.333V195.833H260.444Z' stroke='%23E0E0E0' stroke-width='2'/%3E%3Cpath d='M253.333 110H232.778C230.121 110 228 112.121 228 114.778V191.056C228 193.712 230.121 195.833 232.778 195.833H253.333V110Z' stroke='%23E0E0E0' stroke-width='2'/%3E%3Ccircle cx='259' cy='153' r='2' fill='%23E0E0E0'/%3E%3Crect x='193' y='69' width='44' height='44' rx='8' stroke='%23E0E0E0' stroke-width='2'/%3E%3Ccircle cx='204' cy='84' r='2' fill='%23E0E0E0'/%3E%3Ccircle cx='222' cy='84' r='2' fill='%23E0E0E0'/%3E%3Cpath d='M204 95C204 95 208 101 213 101C218 101 222 95 222 95' stroke='%23E0E0E0' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M140.5 36.5L145.5 31.5L150.5 36.5' stroke='%23E0E0E0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M145.5 32V47.5' stroke='%23E0E0E0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Crect x='112' y='145' width='60' height='60' rx='30' stroke='%23E0E0E0' stroke-width='2'/%3E%3Crect x='103' y='204' width='78' height='10' rx='5' stroke='%23E0E0E0' stroke-width='2'/%3E%3Cpath d='M120.321 184.054C122.924 174.479 132.553 169.13 142.128 171.733C151.703 174.336 157.052 183.965 154.449 193.54' stroke='%23E0E0E0' stroke-width='2'/%3E%3Crect x='11' y='81' width='100' height='70' rx='8' stroke='%23E0E0E0' stroke-width='2'/%3E%3Cpath d='M23 97H57' stroke='%23E0E0E0' stroke-width='2' stroke-linecap='round'/%3E%3Crect x='23' y='109' width='12' height='12' rx='2' stroke='%23E0E0E0' stroke-width='2'/%3E%3Cpath d='M41 115H99' stroke='%23E0E0E0' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M41 127H83' stroke='%23E0E0E0' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M29 115L31.5 117.5L37 111.5' stroke='%23E0E0E0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right bottom',
      }}
    />
  );


// ====================================================================
// TasksPage Component
// ====================================================================
export const TasksPage: React.FC = () => {
    const { 
        lists, 
        tasks,
        pomodoroSessions,
        tags: allTags,
        filters,
        activities,
        handleAddList, 
        handleAddTask, 
        handleUpdateTask,
        handleToggleComplete, 
        handleToggleSubtaskComplete, 
        handleAddSubtask,
        handleDeleteTask, 
        handleGenerateSubtasks, 
        handleSetRecurrence,
        handleWontDoTask,
        handleRestoreTask,
        handlePermanentDeleteTask,
        handleEmptyTrash,
        handleAddTag,
        handleAddFilter,
        handleReorderTask,
    } = useData();
    const { settings, onSettingsChange } = useSettings();
    // FIX: Correctly destructure useApiUsage to get the logApiCall function.
    const [, logApiCall] = useApiUsage();
    
    const [activeView, setActiveView] = useState('welcome');
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    
    const [viewMode, setViewMode] = useLocalStorage<'list' | 'kanban' | 'timeline'>('tasks-view-mode', 'list');
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [showCompleted, setShowCompleted] = useLocalStorage('tasks-show-completed', false);
    const [showDetails, setShowDetails] = useLocalStorage('tasks-show-details', false);
    const moreMenuTriggerRef = useRef<HTMLButtonElement>(null);
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage('tasks-sidebar-collapsed', false);
    const [isListActivitiesOpen, setListActivitiesOpen] = useState(false);
    
    const [taskDetailPopoverState, setTaskDetailPopoverState] = useState<{ taskId: string, triggerRef: React.RefObject<HTMLElement> } | null>(null);

    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);

    // State for sort menu and submenus
    const [groupBy, setGroupBy] = useLocalStorage<string>('tasks-group-by', 'Custom');
    const [sortBy, setSortBy] = useLocalStorage<string>('tasks-sort-by', 'Custom');
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState<'group' | 'sort' | null>(null);
    const sortMenuTriggerRef = useRef<HTMLButtonElement>(null);
    const groupSubmenuTriggerRef = useRef<HTMLDivElement>(null);
    const sortSubmenuTriggerRef = useRef<HTMLDivElement>(null);
    const hideSubmenuTimer = useRef<number>();
    
    const isDragDisabled = groupBy !== 'Custom' || activeView === 'inbox';

    // Handlers for hover-based submenus
    const handleSubmenuEnter = useCallback(() => {
        clearTimeout(hideSubmenuTimer.current);
    }, []);

    const handleSubmenuLeave = useCallback(() => {
        hideSubmenuTimer.current = window.setTimeout(() => {
            setActiveSubmenu(null);
        }, 200); // Small delay to allow moving to the submenu
    }, []);


    const handleDragStart = (id: string) => setDraggedId(id);
    const handleDragEnter = (id: string) => { if (id !== draggedId) setDropTargetId(id); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (draggedId && dropTargetId) {
            // Switch to custom sorting to allow manual reorder to persist.
            if (activeView !== 'inbox') {
                setGroupBy('Custom');
                setSortBy('Custom');
            }
            handleReorderTask(draggedId, dropTargetId, activeView);
        }
        setDraggedId(null);
        setDropTargetId(null);
    };
    const handleDragEnd = () => {
        setDraggedId(null);
        setDropTargetId(null);
    };

    const handleAddSection = (name: string, afterTaskId?: string, beforeTaskId?: string) => {
        const listId = lists.some(l => l.id === activeView) ? activeView : 'inbox';
        handleAddTask({
            title: name, listId, isSection: true, isCollapsed: false,
            afterTaskId: afterTaskId, priority: Priority.NONE, dueDate: null, startDate: null, isAllDay: false, recurrence: null, reminder: null, tags: [],
        });
        setIsAddingSection(false);
    };
    
    const handleRenameSection = (sectionId: string, newName: string) => {
        handleUpdateTask(sectionId, { title: newName });
    };

    const handleDeleteSection = (sectionId: string) => {
        if (window.confirm("Are you sure you want to delete this section and all its tasks?")) {
            const sectionIndex = filteredTasks.findIndex(t => t.id === sectionId);
            const tasksToDelete = [sectionId];
            for (let i = sectionIndex + 1; i < filteredTasks.length; i++) {
                if (filteredTasks[i].isSection) break;
                tasksToDelete.push(filteredTasks[i].id);
            }
            // FIX: Pass the task ID to handleDeleteTask.
            tasksToDelete.forEach(id => handleDeleteTask(id));
        }
    };
    
    const onMoveSection = (sectionId: string, newListId: string) => {
        const sectionIndex = filteredTasks.findIndex(t => t.id === sectionId);
        const tasksToMove = [sectionId];
        for (let i = sectionIndex + 1; i < filteredTasks.length; i++) {
            if (filteredTasks[i].isSection) break;
            tasksToMove.push(filteredTasks[i].id);
        }
        tasksToMove.forEach(id => handleUpdateTask(id, { listId: newListId }));
    };

    const handleAddTaskToSection = (title: string, afterTaskId: string) => {
        handleAddTask({ title, listId: activeView, afterTaskId, priority: Priority.NONE, dueDate: null, startDate: null, isAllDay: false, recurrence: null, reminder: null, tags: [] });
    };

    const handleToggleSectionCollapse = (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task && task.isSection) {
            handleUpdateTask(taskId, { isCollapsed: !task.isCollapsed });
        }
    };

    const isSpecialView = ['completed', 'wontdo', 'trash'].includes(activeView);
    const isRealList = useMemo(() => lists.some(l => l.id === activeView), [lists, activeView]);


    const filteredTasks = useMemo(() => {
        const now = new Date();
        const formatDate = (date: Date) => date.toLocaleDateString('en-CA', { timeZone: settings.timezone });

        if (activeView === 'completed' || (showCompleted && !isSpecialView)) {
             const completedTasks = tasks.filter(t => t.completed && !t.trashed);
             if (activeView === 'completed') return completedTasks;
        }

        if (activeView === 'wontdo') {
            return tasks.filter(t => t.wontDo && !t.trashed);
        }
        if (activeView === 'trash') {
            return tasks.filter(t => t.trashed);
        }
        
        const activeTasks = tasks.filter(t => !t.trashed);
        const baseFiltered = showCompleted ? activeTasks.filter(t => !t.wontDo) : activeTasks.filter(t => !t.completed && !t.wontDo);

        const activeFilter = filters.find(f => f.id === activeView);
        if (activeFilter) {
            return activeTasks.filter(task => {
                if (task.completed || task.wontDo) return false;

                const listMatch = activeFilter.lists.length === 0 || activeFilter.lists.includes(task.listId);
                const tagMatch = activeFilter.tags.length === 0 || activeFilter.tags.every(tagId => task.tags.includes(tagId));
                
                const priorityMatch = activeFilter.priority === 'All' || !activeFilter.priority || task.priority === activeFilter.priority;

                const dateMatch = (() => {
                    if (!activeFilter.date || activeFilter.date === 'any') return true;
                    if (!task.dueDate) return false;
                    
                    const today = new Date(now.toLocaleDateString('en-US', { timeZone: settings.timezone }));
                    const taskDate = new Date(new Date(task.dueDate.split(' ')[0]).toLocaleDateString('en-US', { timeZone: settings.timezone }));
                    
                    switch (activeFilter.date) {
                        case 'today': return taskDate.getTime() === today.getTime();
                        case 'tomorrow': 
                            const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
                            return taskDate.getTime() === tomorrow.getTime();
                        case 'thisWeek':
                            const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
                            const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
                            return taskDate >= weekStart && taskDate <= weekEnd;
                        case 'thisMonth':
                            return taskDate.getFullYear() === today.getFullYear() && taskDate.getMonth() === today.getMonth();
                        case 'overdue':
                            return taskDate < today;
                    }
                    return false;
                })();

                if (!dateMatch) return false;
                
                // Keyword match
                if (activeFilter.includeKeywords?.trim()) {
                    const keywords = activeFilter.includeKeywords.trim().toLowerCase();
                    if (!task.title.toLowerCase().includes(keywords) && (!task.description || !task.description.toLowerCase().includes(keywords))) {
                        return false;
                    }
                }

                return listMatch && tagMatch && priorityMatch;
            });
        }

        let tasksForView = baseFiltered;

        if (activeView === 'all') {
            tasksForView = baseFiltered;
        } else if (activeView === 'today') {
            tasksForView = baseFiltered.filter(task => task.dueDate && task.dueDate.startsWith(formatDate(now)));
        } else if (activeView === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);
            tasksForView = baseFiltered.filter(task => task.dueDate && task.dueDate.startsWith(formatDate(tomorrow)));
        } else if (activeView === 'next7days') {
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(now.getDate() + 6);
            tasksForView = baseFiltered.filter(task => {
                if (!task.dueDate) return false;
                try {
                    const taskDate = new Date(task.dueDate.split(' ')[0] + 'T00:00:00Z');
                    return taskDate >= now && taskDate <= sevenDaysFromNow;
                } catch(e) { return false; }
            });
        } else if (isRealList || activeView === 'inbox') {
            tasksForView = baseFiltered.filter(task => task.listId === activeView);
        } else if (filters.some(f => f.id === activeView)) {
            // Already handled above
            return tasksForView;
        }

        // --- Special Inbox Logic ---
        if (activeView === 'inbox') {
            const high = tasksForView.filter(t => t.priority === Priority.HIGH);
            const medium = tasksForView.filter(t => t.priority === Priority.MEDIUM);
            const lowNone = tasksForView.filter(t => t.priority === Priority.LOW || t.priority === Priority.NONE);

            return [
                ...(high.length > 0 ? [{ id: 'inbox-section-high', title: 'High Priority', isSection: true, listId: 'inbox' } as Task, ...high] : []),
                ...(medium.length > 0 ? [{ id: 'inbox-section-medium', title: 'Medium Priority', isSection: true, listId: 'inbox' } as Task, ...medium] : []),
                ...(lowNone.length > 0 ? [{ id: 'inbox-section-low', title: 'Low Priority', isSection: true, listId: 'inbox' } as Task, ...lowNone] : []),
            ];
        }

        // --- Sorting Logic ---
        let sortedTasks = [...tasksForView];

        const sortFunctions: Record<string, (a: Task, b: Task) => number> = {
            'List': (a, b) => lists.findIndex(l => l.id === a.listId) - lists.findIndex(l => l.id === b.listId),
            'Date': (a, b) => (a.dueDate || 'z').localeCompare(b.dueDate || 'z'),
            'Priority': (a, b) => {
                const pOrder = { [Priority.HIGH]: 0, [Priority.MEDIUM]: 1, [Priority.LOW]: 2, [Priority.NONE]: 3 };
                return pOrder[a.priority] - pOrder[b.priority];
            },
            'Title': (a, b) => a.title.localeCompare(b.title),
        };

        if (sortBy !== 'Custom' && sortFunctions[sortBy]) {
            sortedTasks.sort(sortFunctions[sortBy]);
        }

        if (groupBy !== 'Custom' && sortFunctions[groupBy] && groupBy !== sortBy) {
            sortedTasks.sort(sortFunctions[groupBy]);
        }

        return sortedTasks;

    }, [activeView, tasks, lists, filters, settings.timezone, showCompleted, isRealList, sortBy, groupBy]);

    const activeList = useMemo(() => {
        return lists.find(l => l.id === activeView);
    }, [activeView, lists]);
    
    const activeFilter = useMemo(() => {
        return filters.find(f => f.id === activeView);
    }, [activeView, filters]);

    const handleSelectTask = (taskId: string, triggerRef?: React.RefObject<HTMLElement>) => {
        if (settings.taskInputStyle === 'simple') {
            const taskElement = triggerRef?.current || document.querySelector(`[data-task-id="${taskId}"]`);
            setTaskDetailPopoverState({ taskId, triggerRef: { current: taskElement as HTMLElement } });
        } else {
            setSelectedTaskId(prevId => (prevId === taskId ? null : taskId));
        }
    };

    const handleCloseDetail = () => {
        setSelectedTaskId(null);
    };

    const selectedTask = useMemo(() => {
        if (!selectedTaskId) return null;
        return tasks.find(t => t.id === selectedTaskId) || null;
    }, [selectedTaskId, tasks]);
    
    const popoverTask = useMemo(() => {
        if (!taskDetailPopoverState) return null;
        return tasks.find(t => t.id === taskDetailPopoverState.taskId) || null;
    }, [taskDetailPopoverState, tasks]);

    const sections = useMemo(() => filteredTasks.filter(t => t.isSection), [filteredTasks]);
    
    const tasksBySection = useMemo(() => {
        const bySection: Record<string, Task[]> = { 'no-section': [] };
        let currentSectionId = 'no-section';

        for (const task of filteredTasks) {
            if (task.isSection) {
                currentSectionId = task.id;
                if (!bySection[currentSectionId]) {
                    bySection[currentSectionId] = [];
                }
            } else {
                bySection[currentSectionId].push(task);
            }
        }
        return bySection;
    }, [filteredTasks]);
    
    const renderTaskList = () => {
        if (filteredTasks.length === 0 && !isAddingSection) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative">
                    <DoodlesBackground />
                    <CheckItemIcon className="w-16 h-16 text-content-tertiary mb-4" />
                    <h3 className="text-xl font-semibold text-content-primary">All tasks completed</h3>
                    <p className="text-content-secondary">Take a break or add a new task.</p>
                </div>
            );
        }

        const taskItemsToRender: {task: Task, isSection: boolean}[] = [];
        if (sections.length === 0) {
            tasksBySection['no-section'].forEach(task => taskItemsToRender.push({ task, isSection: false }));
        } else {
            sections.forEach(section => {
                taskItemsToRender.push({ task: section, isSection: true });
                if (!section.isCollapsed) {
                    (tasksBySection[section.id] || []).forEach(task => taskItemsToRender.push({ task, isSection: false }));
                }
            });
        }

        return taskItemsToRender.map(({ task, isSection }, index) => {
            if (isSection) {
                const sectionTasks = tasksBySection[task.id] || [];
                return (
                    <div 
                        key={task.id}
                        draggable={!isDragDisabled}
                        onDragStart={() => handleDragStart(task.id)}
                        onDragEnd={handleDragEnd}
                    >
                        <SectionHeader 
                            section={task} 
                            count={sectionTasks.length} 
                            onToggleCollapse={() => handleToggleSectionCollapse(task.id)}
                            onDragEnter={() => handleDragEnter(task.id)}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            isDropTarget={dropTargetId === task.id}
                            isDragDisabled={isDragDisabled}
                            onAddSection={handleAddSection}
                            onRenameSection={handleRenameSection}
                            onDeleteSection={handleDeleteSection}
                            onMoveSection={onMoveSection}
                            onAddTask={handleAddTaskToSection}
                            lists={lists}
                            settings={settings}
                            onSettingsChange={onSettingsChange}
                            logApiCall={logApiCall}
                        />
                        {sectionTasks.length === 0 && !task.isCollapsed && <EmptySectionDropzone onDragEnter={() => handleDragEnter(task.id)} onDrop={handleDrop} onDragEnd={handleDragEnd} isDropTarget={dropTargetId === task.id} isDragDisabled={isDragDisabled} />}
                    </div>
                );
            }
            return (
                <div key={task.id} data-task-id={task.id}>
                    <TaskItem 
                        task={task}
                        onToggleComplete={handleToggleComplete}
                        onToggleSubtaskComplete={handleToggleSubtaskComplete}
                        onDelete={handleDeleteTask}
                        onGenerateSubtasks={handleGenerateSubtasks}
                        onSetRecurrence={handleSetRecurrence}
                        onWontDo={handleWontDoTask}
                        onRestore={handleRestoreTask}
                        onPermanentDelete={handlePermanentDeleteTask}
                        aiEnabled={settings.enableAIFeatures}
                        onSelect={(taskId) => handleSelectTask(taskId)}
                        isSelected={selectedTaskId === task.id}
                        settings={settings}
                        onDragStart={() => handleDragStart(task.id)}
                        onDrop={handleDrop}
                        onDragEnter={() => handleDragEnter(task.id)}
                        onDragEnd={handleDragEnd}
                        isDropTarget={dropTargetId === task.id}
                        allTags={allTags}
                        showDetails={showDetails}
                        isDragDisabled={isDragDisabled}
                    />
                </div>
            );
        });
    };
    
    const getActiveListName = () => {
        if (activeList) return activeList.name;
        if (activeFilter) return activeFilter.name;
        const smartList = smartListsConfig.find(sl => sl.id === activeView);
        if(smartList) return smartList.name;
        if(activeView === 'trash') return "Trash";
        if(activeView === 'wontdo') return "Won't Do";
        return 'Tasks';
    }

    return (
        <ResizablePanel 
            storageKey="tasks-sidebar-width" 
            initialWidth={isSidebarCollapsed ? 0 : 288} 
            minWidth={isSidebarCollapsed ? 0 : 240} 
            maxWidth={500}
        >
            <TasksSidebar 
                lists={lists} 
                tasks={tasks}
                tags={allTags}
                filters={filters}
                activeView={activeView} 
                onSelectView={setActiveView} 
                onAddList={handleAddList}
                onAddTag={handleAddTag}
                onAddFilter={handleAddFilter}
                settings={settings}
                onSettingsChange={onSettingsChange}
            />
            <div className="flex-1 flex min-w-0">
                <main className="flex-1 flex flex-col min-w-0 h-full">
                    <header className="px-6 py-4 flex justify-between items-center border-b border-border-primary flex-shrink-0">
                         <div className="flex items-center space-x-2">
                            <button onClick={() => setIsSidebarCollapsed(c => !c)} className="p-2 rounded-full hover:bg-background-secondary">
                                <SidebarCollapseIcon className={`w-5 h-5 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
                            </button>
                            <h1 className="text-2xl font-bold text-content-primary">{getActiveListName()}</h1>
                         </div>
                        <div className="flex items-center space-x-2">
                             <button ref={sortMenuTriggerRef} onClick={() => setIsSortMenuOpen(o => !o)} className="p-2 rounded-full text-content-secondary hover:bg-background-secondary"><SortIcon className="h-5 w-5" /></button>
                             <button onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')} className="p-2 rounded-full text-content-secondary hover:bg-background-secondary">
                                {viewMode === 'list' ? <MatrixIcon /> : <LibraryIcon />}
                            </button>
                             <button ref={moreMenuTriggerRef} onClick={() => setIsMoreMenuOpen(o => !o)} className="p-2 rounded-full text-content-secondary hover:bg-background-secondary"><MoreIcon /></button>
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto min-h-0 relative">
                         {viewMode === 'list' && (
                             <div className="px-6 py-2">
                                {renderTaskList()}
                                {isAddingSection && <AddSectionInput onAddSection={handleAddSection} onCancel={() => setIsAddingSection(false)} />}
                            </div>
                         )}
                         {viewMode === 'kanban' && <KanbanView tasks={filteredTasks} allTags={allTags} settings={settings} selectedTaskId={selectedTaskId} onToggleComplete={handleToggleComplete} onSelect={(taskId, ref) => handleSelectTask(taskId, ref)} onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDrop={handleDrop} onDragEnd={handleDragEnd} onToggleSectionCollapse={handleToggleSectionCollapse} onToggleSubtaskComplete={handleToggleSubtaskComplete} onDelete={handleDeleteTask} onGenerateSubtasks={handleGenerateSubtasks} onSetRecurrence={handleSetRecurrence} onWontDo={handleWontDoTask} onRestore={handleRestoreTask} onPermanentDelete={handlePermanentDeleteTask} aiEnabled={settings.enableAIFeatures} lists={lists} showDetails={showDetails} onAddTask={handleAddTask} logApiCall={logApiCall} onSettingsChange={onSettingsChange} activeListId={activeView} onRenameSection={handleRenameSection} onDeleteSection={handleDeleteSection} onAddSection={handleAddSection} draggedId={draggedId} dropTargetId={dropTargetId} isDragDisabled={isDragDisabled} isRealList={isRealList} />}
                         {viewMode === 'timeline' && <TimelineView tasks={filteredTasks} onSelectTask={(taskId, ref) => handleSelectTask(taskId, ref)} onUpdateTask={handleUpdateTask} />}
                    </div>
                    <footer className="flex-shrink-0">
                        {settings.taskInputStyle === 'simple' 
                            ? <SimpleAddTaskForm lists={lists} onAddTask={handleAddTask} aiEnabled={settings.enableAIFeatures} activeListId={activeView} logApiCall={logApiCall} onSettingsChange={onSettingsChange} settings={settings} onDeactivate={() => {}} /> 
                            : <DetailedAddTaskForm lists={lists} onAddTask={handleAddTask} aiEnabled={settings.enableAIFeatures} activeListId={activeView} logApiCall={logApiCall} onSettingsChange={onSettingsChange} settings={settings} onDeactivate={() => {}} /> }
                    </footer>
                </main>
                <AnimatePresence>
                {selectedTask && (
                     <motion.div initial={{ width: 0 }} animate={{ width: 450 }} exit={{ width: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="flex-shrink-0 h-full overflow-hidden">
                        <TaskDetailPanel 
                            key={selectedTask.id}
                            task={selectedTask}
                            tasks={tasks}
                            lists={lists}
                            pomodoroSessions={pomodoroSessions}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                            onAddSubtask={handleAddSubtask}
                            onToggleSubtaskComplete={handleToggleSubtaskComplete}
                            onReorderTask={handleReorderTask}
                        />
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
            {popoverTask && taskDetailPopoverState?.triggerRef.current && (
                <TaskDetailPopover
                    task={popoverTask}
                    triggerRef={taskDetailPopoverState.triggerRef}
                    onClose={() => setTaskDetailPopoverState(null)}
                    lists={lists}
                    tasks={tasks}
                    pomodoroSessions={pomodoroSessions}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    onAddSubtask={handleAddSubtask}
                    onToggleSubtaskComplete={handleToggleSubtaskComplete}
                    onReorderTask={handleReorderTask}
                />
            )}
            <PlanWithAIModal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} lists={lists} onAddPlan={(plan) => {
                plan.forEach(taskSuggestion => {
                    const list = lists.find(l => l.name === taskSuggestion.listName) || lists.find(l => l.id === 'inbox');
                    handleAddTask({ title: taskSuggestion.title, listId: list!.id, priority: Priority.NONE, dueDate: null, startDate: null, isAllDay: false, recurrence: null, reminder: null, tags: [] });
                });
                setIsPlanModalOpen(false);
            }} logApiCall={logApiCall} />
            <Popover isOpen={isMoreMenuOpen} onClose={() => setIsMoreMenuOpen(false)} triggerRef={moreMenuTriggerRef} position="bottom-end">
                <div className="w-64 bg-[#2f2f2f] rounded-lg shadow-xl border border-border-primary p-2 text-white">
                    <MenuItem icon={<CheckItemIcon/>} label={showCompleted ? "Hide Completed Tasks" : "Show Completed Tasks"} onClick={() => setShowCompleted(s => !s)} />
                    <MenuItem icon={<LibraryIcon/>} label={showDetails ? "Hide Task Details" : "Show Task Details"} onClick={() => setShowDetails(s => !s)} />
                    {isRealList && <MenuItem icon={<MagicIcon/>} label="Plan with AI..." onClick={() => setIsPlanModalOpen(true)} />}
                    {isRealList && activeView !== 'inbox' && <MenuItem icon={<PlusIcon/>} label="Add Section" onClick={() => setIsAddingSection(true)} />}
                    {isRealList && <MenuItem icon={<AnalyticsIcon/>} label="Activities" onClick={() => setListActivitiesOpen(true)} />}
                    <div className="border-t border-border-primary my-1"></div>
                    <MenuItem icon={<PrintIcon/>} label="Print" />
                    <MenuItem icon={<ShareIcon/>} label="Share" />
                    <MenuItem icon={<SettingsIcon/>} label="Settings" />
                </div>
            </Popover>
            <Popover isOpen={isSortMenuOpen} onClose={() => setIsSortMenuOpen(false)} triggerRef={sortMenuTriggerRef} position="bottom-end">
                <div className="w-56 bg-[#2f2f2f] rounded-lg shadow-xl border border-border-primary p-2 text-white text-sm" onMouseLeave={() => setActiveSubmenu(null)}>
                    <div ref={groupSubmenuTriggerRef} onMouseEnter={() => setActiveSubmenu('group')}><MenuItem icon={<MatrixIcon/>} label="Group By" currentValue={groupBy} hasSubmenu /></div>
                    <div ref={sortSubmenuTriggerRef} onMouseEnter={() => setActiveSubmenu('sort')}><MenuItem icon={<SortByIcon/>} label="Sort By" currentValue={sortBy} hasSubmenu /></div>
                </div>
            </Popover>
            <Popover isOpen={activeSubmenu === 'group'} onClose={() => {}} triggerRef={groupSubmenuTriggerRef} position="right-start" className="ml-1">
                 <div className="w-48 bg-[#2f2f2f] rounded-lg shadow-xl border border-border-primary p-1 text-white text-sm" onMouseEnter={handleSubmenuEnter} onMouseLeave={handleSubmenuLeave}>
                    {['Custom', 'List', 'Date', 'Priority', 'Title'].map(opt => <button key={opt} onClick={() => { setGroupBy(opt); setIsSortMenuOpen(false); setActiveSubmenu(null);}} className="w-full text-left p-2 rounded hover:bg-background-tertiary">{opt}</button>)}
                </div>
            </Popover>
            <Popover isOpen={activeSubmenu === 'sort'} onClose={() => {}} triggerRef={sortSubmenuTriggerRef} position="right-start" className="ml-1">
                 <div className="w-48 bg-[#2f2f2f] rounded-lg shadow-xl border border-border-primary p-1 text-white text-sm" onMouseEnter={handleSubmenuEnter} onMouseLeave={handleSubmenuLeave}>
                    {['Custom', 'Date', 'Priority', 'Title'].map(opt => <button key={opt} onClick={() => { setSortBy(opt); setIsSortMenuOpen(false); setActiveSubmenu(null);}} className="w-full text-left p-2 rounded hover:bg-background-tertiary">{opt}</button>)}
                </div>
            </Popover>
            {activeList && <ListActivitiesModal isOpen={isListActivitiesOpen} onClose={() => setListActivitiesOpen(false)} listId={activeList.id} listName={activeList.name} activities={activities} />}
        </ResizablePanel>
    );
};