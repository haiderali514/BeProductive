import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Priority, Task, List, AddTaskFormProps } from '../types';
import { TaskItem } from './TaskItem';
import { SmartAddTaskForm } from './SmartAddTaskForm';
import { SimpleAddTaskForm } from './SimpleAddTaskForm';
import { PlanWithAIModal } from './PlanWithAIModal';
import { AITaskSuggestion } from '../services/geminiService';
import { useSettings } from '../contexts/SettingsContext';
import { useData } from '../contexts/DataContext';
import { useApiUsage } from '../contexts/ApiUsageContext';
import { ResizablePanel } from './ResizablePanel';
import { TaskDetailPanel } from './TaskDetailPanel';
import { TasksSidebar } from './TasksSidebar';
import { MoreIcon, PlusIcon, ChevronDownIcon, LibraryIcon, MatrixIcon, FiltersIcon, CheckItemIcon, HamburgerMenuIcon, SettingsIcon, ShareIcon, AnalyticsIcon, PrintIcon, ChevronRightIcon, MagicIcon } from './Icons';
import { Popover } from './Popover';
import useLocalStorage from '../hooks/useLocalStorage';

// ====================================================================
// New Section Components
// ====================================================================

const SectionHeader: React.FC<{
    title: string;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}> = ({ title, isCollapsed, onToggleCollapse }) => {
    return (
        <div className="flex items-center group px-3 py-1 cursor-pointer" onClick={onToggleCollapse}>
            <ChevronDownIcon className={`h-4 w-4 text-content-tertiary transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
            <h2 className="text-sm font-bold uppercase text-content-tertiary ml-2">{title}</h2>
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
             <ChevronDownIcon className={`h-4 w-4 text-content-tertiary`} />
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
}> = ({ icon, label, onClick, hasSubmenu }) => (
    <button onClick={onClick} className="w-full text-left flex items-center justify-between p-2 rounded hover:bg-[#2f2f2f]">
        <div className="flex items-center space-x-3">
            {icon}
            <span>{label}</span>
        </div>
        {hasSubmenu && <ChevronRightIcon className="w-4 h-4 text-content-tertiary" />}
    </button>
);

// ====================================================================
// TasksPage Component
// ====================================================================
export const TasksPage: React.FC = () => {
    const { 
        lists, 
        tasks,
        pomodoroSessions,
        tags,
        filters,
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
    const [, logApiCall] = useApiUsage();
    
    const [activeView, setActiveView] = useState('inbox');
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    
    // New state for sections and menus
    const [viewMode, setViewMode] = useLocalStorage<'list' | 'board'>('tasks-view-mode', 'list');
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const moreMenuTriggerRef = useRef<HTMLButtonElement>(null);
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [isPinnedCollapsed, setIsPinnedCollapsed] = useState(false);

    // Drag and drop state
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);

    const handleDragStart = (id: string) => setDraggedId(id);
    const handleDragEnter = (id: string) => { if (id !== draggedId) setDropTargetId(id); };
    const handleDrop = () => {
        if (draggedId && dropTargetId) {
            handleReorderTask(draggedId, dropTargetId);
        }
        setDraggedId(null);
        setDropTargetId(null);
    };
    const handleDragEnd = () => {
        setDraggedId(null);
        setDropTargetId(null);
    };

    const handleAddSection = (name: string) => {
        const listId = lists.some(l => l.id === activeView) ? activeView : 'inbox';
        handleAddTask({
            title: name,
            listId: listId,
            priority: Priority.NONE,
            dueDate: null,
            recurrence: null,
            tags: [],
            isSection: true, 
            isCollapsed: false,
        });
        setIsAddingSection(false);
    };

    const handleToggleSectionCollapse = (taskId: string) => {
        if (taskId === 'pinned-section') {
            setIsPinnedCollapsed(p => !p);
            return;
        }
        const task = tasks.find(t => t.id === taskId);
        if (task && task.isSection) {
            handleUpdateTask(taskId, { isCollapsed: !task.isCollapsed });
        }
    };

    const isSpecialView = ['completed', 'wontdo', 'trash'].includes(activeView);

    const filteredTasks = useMemo(() => {
        const now = new Date();
        const formatDate = (date: Date) => date.toLocaleDateString('en-CA', { timeZone: settings.timezone });

        if (activeView === 'completed') {
            return tasks.filter(t => t.completed && !t.trashed);
        }
        if (activeView === 'wontdo') {
            return tasks.filter(t => t.wontDo && !t.trashed);
        }
        if (activeView === 'trash') {
            return tasks.filter(t => t.trashed);
        }
        
        const activeTasks = tasks.filter(t => !t.trashed);

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
                            return taskDate < today && !task.completed;
                        default: return true;
                    }
                })();

                return listMatch && tagMatch && dateMatch && priorityMatch;
            });
        }
        
        const nonCompletedActiveTasks = activeTasks.filter(t => !t.completed && !t.wontDo);

        switch (activeView) {
            case 'all':
                return nonCompletedActiveTasks;
            case 'today':
                const todayStr = formatDate(now);
                return nonCompletedActiveTasks.filter(t => t.dueDate && t.dueDate.startsWith(todayStr));
            case 'tomorrow':
                const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const tomorrowStr = formatDate(tomorrowDate);
                return nonCompletedActiveTasks.filter(t => t.dueDate && t.dueDate.startsWith(tomorrowStr));
            case 'next7days':
                const sevenDaysEnd = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
                const startStr = formatDate(now);
                const endStr = formatDate(sevenDaysEnd);

                return nonCompletedActiveTasks.filter(t => {
                    if (!t.dueDate) return false;
                    const taskDateStr = t.dueDate.split(' ')[0];
                    return taskDateStr >= startStr && taskDateStr <= endStr;
                });
            default: 
                if (tags.some(t => t.id === activeView)) {
                    return nonCompletedActiveTasks.filter(task => task.tags.includes(activeView));
                }
                return nonCompletedActiveTasks.filter(task => task.listId === activeView);
        }
    }, [tasks, activeView, filters, tags, settings.timezone]);

    const { pinnedTasks, unpinnedTasks } = useMemo(() => {
        if (isSpecialView) {
            return { pinnedTasks: [], unpinnedTasks: filteredTasks };
        }
        const pinned = filteredTasks.filter(task => task.pinned && !task.isSection);
        const unpinned = filteredTasks.filter(task => !task.pinned);
        return { pinnedTasks: pinned, unpinnedTasks: unpinned };
    }, [filteredTasks, isSpecialView]);

    const SMART_LIST_NAMES: Record<string, string> = {
        all: 'All Tasks',
        today: 'Today',
        tomorrow: 'Tomorrow',
        next7days: 'Next 7 Days',
        assignedToMe: 'Assigned to Me',
        inbox: 'Inbox',
        summary: 'Summary',
        completed: 'Completed',
        wontdo: "Won't Do",
        trash: 'Trash',
    };

    const activeListName = useMemo(() => {
        return SMART_LIST_NAMES[activeView] 
            || lists.find(l => l.id === activeView)?.name 
            || tags.find(t => t.id === activeView)?.name
            || filters.find(f => f.id === activeView)?.name
            || 'Tasks';
    }, [lists, tags, filters, activeView]);

    const selectedTask = useMemo(() => {
        return tasks.find(task => task.id === selectedTaskId) || null;
    }, [tasks, selectedTaskId]);

    useEffect(() => {
        if (selectedTaskId && !tasks.some(t => t.id === selectedTaskId)) {
            setSelectedTaskId(null);
        }
    }, [tasks, selectedTaskId]);
    
    const handleAddPlan = (plan: AITaskSuggestion[]) => {
        plan.forEach(suggestedTask => {
            const list = lists.find(l => l.name.toLowerCase() === suggestedTask.listName.toLowerCase()) || lists.find(l => l.id === 'inbox');
            handleAddTask({
                title: suggestedTask.title,
                listId: list!.id,
                priority: Priority.NONE,
                dueDate: null,
                recurrence: null,
                tags: []
            });
        });
        setIsPlanModalOpen(false);
    };

    const handleSelectTask = (taskId: string) => {
        setSelectedTaskId(prevId => (prevId === taskId ? null : taskId));
    };

    const handleDeleteTaskAndClosePanel = (taskId: string) => {
        handleDeleteTask(taskId);
        setSelectedTaskId(null);
    };
    
    const renderTaskList = (taskList: Task[]) => {
        const elements: React.ReactNode[] = [];
        let isCurrentSectionCollapsed = false;

        for (const task of taskList) {
            if (task.isSection) {
                isCurrentSectionCollapsed = task.isCollapsed ?? false;
                elements.push(
                    <SectionHeader
                        key={task.id}
                        title={task.title}
                        isCollapsed={isCurrentSectionCollapsed}
                        onToggleCollapse={() => handleToggleSectionCollapse(task.id)}
                    />
                );
            } else {
                if (!isCurrentSectionCollapsed) {
                    elements.push(
                         <TaskItem 
                            key={task.id}
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
                            onSelect={handleSelectTask}
                            isSelected={task.id === selectedTaskId}
                            settings={settings}
                            onDragStart={() => handleDragStart(task.id)}
                            onDrop={handleDrop}
                            onDragEnter={() => handleDragEnter(task.id)}
                            onDragEnd={handleDragEnd}
                            isDropTarget={dropTargetId === task.id}
                        />
                    );
                }
            }
        }
        return elements;
    }

    const MainContent = () => {
        const boardSections = useMemo(() => {
            if (viewMode !== 'board' || isSpecialView) return [];
        
            const sections: { sectionTask: Task | null; tasks: Task[] }[] = [];
        
            // Start with a default section for tasks without one
            let currentSection: { sectionTask: Task | null; tasks: Task[] } = {
                sectionTask: null, // Represents the 'No Section' column
                tasks: []
            };
        
            for (const task of unpinnedTasks) {
                if (task.isSection) {
                    if (currentSection.sectionTask || currentSection.tasks.length > 0) {
                         sections.push(currentSection);
                    }
                    currentSection = { sectionTask: task, tasks: [] };
                } else {
                    currentSection.tasks.push(task);
                }
            }
            sections.push(currentSection);
        
            const allSections = [...sections];
        
            if (pinnedTasks.length > 0) {
                allSections.unshift({
                    sectionTask: { id: 'pinned-section', title: 'Pinned', isSection: true, isCollapsed: isPinnedCollapsed } as any,
                    tasks: pinnedTasks
                });
            }
        
            return allSections;
        }, [unpinnedTasks, pinnedTasks, viewMode, isPinnedCollapsed, isSpecialView]);

        return (
            <div className="flex-1 flex flex-col h-full bg-background-primary">
                <header className="p-4 flex justify-between items-center flex-shrink-0">
                    <h1 className="text-2xl font-bold">{activeListName}</h1>
                    <div className="flex items-center space-x-2">
                        <button ref={moreMenuTriggerRef} onClick={() => setIsMoreMenuOpen(true)} className="p-2 text-content-secondary rounded-lg hover:bg-background-tertiary hover:text-content-primary">
                            <MoreIcon className="h-5 w-5" />
                        </button>
                         <Popover isOpen={isMoreMenuOpen} onClose={() => setIsMoreMenuOpen(false)} triggerRef={moreMenuTriggerRef} position="bottom-end">
                            <div className="w-64 bg-[#242424] rounded-lg shadow-xl border border-border-primary text-white text-sm">
                                <div className="p-2">
                                    <div className="px-2 pt-1 pb-2 text-xs text-content-tertiary">VIEW</div>
                                    <MenuItem icon={<LibraryIcon className="w-5 h-5" />} label="List View" onClick={() => { setViewMode('list'); setIsMoreMenuOpen(false); }} />
                                    <MenuItem icon={<MatrixIcon className="w-5 h-5" />} label="Board View" onClick={() => { setViewMode('board'); setIsMoreMenuOpen(false); }} />
                                    <div className="my-1 border-t border-border-primary mx-2"></div>
                                    <MenuItem icon={<CheckItemIcon className="w-5 h-5" />} label="Hide Completed" />
                                    <MenuItem icon={<HamburgerMenuIcon className="w-5 h-5" />} label="Hide Details" />
                                </div>
                                {!isSpecialView && (
                                    <>
                                        <div className="my-1 border-t border-border-primary mx-2"></div>
                                        <div className="p-2">
                                            <MenuItem icon={<MagicIcon />} label="Plan with AI" onClick={() => { setIsPlanModalOpen(true); setIsMoreMenuOpen(false); }} />
                                            <MenuItem icon={<PlusIcon />} label="Add Section" onClick={() => { setIsAddingSection(true); setIsMoreMenuOpen(false); }} />
                                            <MenuItem icon={<ShareIcon className="w-5 h-5" />} label="Share" />
                                            <MenuItem icon={<AnalyticsIcon className="w-5 h-5" />} label="List Activities" />
                                            <MenuItem icon={<PrintIcon className="w-5 h-5" />} label="Print" hasSubmenu />
                                        </div>
                                    </>
                                )}
                            </div>
                        </Popover>
                        {activeView === 'trash' && filteredTasks.length > 0 && (
                            <button 
                                onClick={handleEmptyTrash}
                                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-semibold hover:bg-red-500/30 transition-colors"
                            >
                                Empty Trash
                            </button>
                        )}
                    </div>
                </header>
                
                {!isSpecialView && (
                    settings.taskInputStyle === 'simple' ? (
                        <SimpleAddTaskForm
                            lists={lists}
                            onAddTask={handleAddTask}
                            aiEnabled={settings.enableAIFeatures}
                            activeListId={lists.some(l => l.id === activeView) ? activeView : 'inbox'}
                            logApiCall={logApiCall}
                            onSettingsChange={onSettingsChange}
                            settings={settings}
                            onDeactivate={() => {}}
                        />
                    ) : (
                        <SmartAddTaskForm
                            lists={lists}
                            onAddTask={handleAddTask}
                            aiEnabled={settings.enableAIFeatures}
                            activeListId={lists.some(l => l.id === activeView) ? activeView : 'inbox'}
                            logApiCall={logApiCall}
                            onSettingsChange={onSettingsChange}
                            settings={settings}
                            onDeactivate={() => {}}
                        />
                    )
                )}

                <div className="flex-1 overflow-hidden p-4">
                    {viewMode === 'list' || isSpecialView ? (
                        <div className="h-full overflow-y-auto space-y-3">
                             {pinnedTasks.length > 0 && !isSpecialView &&(
                                <>
                                    <SectionHeader 
                                        title="Pinned" 
                                        isCollapsed={isPinnedCollapsed} 
                                        onToggleCollapse={() => setIsPinnedCollapsed(p => !p)} 
                                    />
                                    {!isPinnedCollapsed && pinnedTasks.map(task => (
                                        <TaskItem key={task.id} task={task} onToggleComplete={handleToggleComplete} onToggleSubtaskComplete={handleToggleSubtaskComplete} onDelete={handleDeleteTask} onGenerateSubtasks={handleGenerateSubtasks} onSetRecurrence={handleSetRecurrence} onWontDo={handleWontDoTask} onRestore={handleRestoreTask} onPermanentDelete={handlePermanentDeleteTask} aiEnabled={settings.enableAIFeatures} onSelect={handleSelectTask} isSelected={task.id === selectedTaskId} settings={settings} onDragStart={() => handleDragStart(task.id)} onDrop={handleDrop} onDragEnter={() => handleDragEnter(task.id)} onDragEnd={handleDragEnd} isDropTarget={dropTargetId === task.id}/>
                                    ))}
                                </>
                            )}
                            {isAddingSection && viewMode === 'list' && (
                                <AddSectionInput onAddSection={handleAddSection} onCancel={() => setIsAddingSection(false)} />
                            )}
                            
                            {unpinnedTasks.length > 0 && (
                                <>
                                    {pinnedTasks.length > 0 && <div className="pt-2"></div>}
                                    {renderTaskList(unpinnedTasks)}
                                </>
                            )}
                            {pinnedTasks.length === 0 && unpinnedTasks.length === 0 && !isAddingSection && (
                                <div className="text-center py-16 text-content-tertiary">
                                    <p className="font-semibold">All clear!</p>
                                    <p className="text-sm mt-1">{isSpecialView ? `No tasks in this view.` : `Add a task to get started.`}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex space-x-4 overflow-x-auto pb-4">
                            {boardSections.map(({ sectionTask, tasks: sectionTasks }) => {
                                const isCollapsed = sectionTask?.id === 'pinned-section' ? isPinnedCollapsed : sectionTask?.isCollapsed;
                                return (
                                <div key={sectionTask?.id || 'no-section'} className="w-72 bg-background-secondary rounded-lg flex flex-col flex-shrink-0 max-h-full">
                                    <div className="p-2 flex-shrink-0 border-b border-border-primary">
                                        <div className="flex items-center group px-1 py-1 cursor-pointer" onClick={() => sectionTask && handleToggleSectionCollapse(sectionTask.id)}>
                                            <ChevronDownIcon className={`h-4 w-4 text-content-tertiary transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                                            <h2 className="text-sm font-bold uppercase text-content-tertiary ml-2">{sectionTask?.title || 'No Section'}</h2>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-2 p-2">
                                        {!isCollapsed && sectionTasks.map(task => (
                                            <TaskItem key={task.id} task={task} onToggleComplete={handleToggleComplete} onToggleSubtaskComplete={handleToggleSubtaskComplete} onDelete={handleDeleteTask} onGenerateSubtasks={handleGenerateSubtasks} onSetRecurrence={handleSetRecurrence} onWontDo={handleWontDoTask} onRestore={handleRestoreTask} onPermanentDelete={handlePermanentDeleteTask} aiEnabled={settings.enableAIFeatures} onSelect={handleSelectTask} isSelected={task.id === selectedTaskId} settings={settings} onDragStart={() => handleDragStart(task.id)} onDrop={handleDrop} onDragEnter={() => handleDragEnter(task.id)} onDragEnd={handleDragEnd} isDropTarget={dropTargetId === task.id} />
                                        ))}
                                    </div>
                                </div>
                            )})}
                            <div className="w-72 flex-shrink-0">
                                {isAddingSection ? (
                                    <AddSectionInput onAddSection={handleAddSection} onCancel={() => setIsAddingSection(false)} />
                                ) : (
                                    <button onClick={() => setIsAddingSection(true)} className="w-full flex items-center p-2 rounded-lg text-content-secondary hover:bg-background-tertiary hover:text-content-primary">
                                        <PlusIcon /> <span className="ml-2">Add column</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }


    return (
        <>
            <ResizablePanel storageKey="tasks-sidebar-width" initialWidth={240} minWidth={200} maxWidth={320}>
                <TasksSidebar
                    lists={lists}
                    tasks={tasks}
                    tags={tags}
                    filters={filters}
                    activeView={activeView}
                    onSelectView={setActiveView}
                    onAddList={handleAddList}
                    onAddTag={handleAddTag}
                    onAddFilter={handleAddFilter}
                    settings={settings}
                    onSettingsChange={onSettingsChange}
                />
                
                <div className="flex-1 flex h-full relative overflow-hidden">
                    <MainContent />
                    <AnimatePresence>
                        {selectedTask && (
                           <>
                                {/* @ts-ignore */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={() => setSelectedTaskId(null)}
                                    className="absolute inset-0 bg-black/50 z-10"
                                />
                                {/* @ts-ignore */}
                                <motion.div
                                    key={selectedTask.id}
                                    initial={{ x: '100%' }}
                                    animate={{ x: '0%' }}
                                    exit={{ x: '100%' }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    className="absolute top-0 right-0 h-full w-[45%] min-w-[400px] max-w-[600px] bg-background-primary shadow-2xl z-20"
                                >
                                    <TaskDetailPanel
                                        task={selectedTask}
                                        lists={lists}
                                        pomodoroSessions={pomodoroSessions}
                                        onUpdateTask={handleUpdateTask}
                                        onDeleteTask={handleDeleteTaskAndClosePanel}
                                        onAddSubtask={handleAddSubtask}
                                        onToggleSubtaskComplete={handleToggleSubtaskComplete}
                                    />
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </ResizablePanel>
            
            {settings.enableAIFeatures && isPlanModalOpen && (
                <PlanWithAIModal
                    isOpen={isPlanModalOpen}
                    onClose={() => setIsPlanModalOpen(false)}
                    onAddPlan={handleAddPlan}
                    lists={lists}
                    logApiCall={logApiCall}
                />
            )}
        </>
    );
};