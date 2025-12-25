import React, { useRef, useEffect, useState } from 'react';
import { Task, Tag, Recurrence, List } from '../types';
import { Settings } from '../hooks/useSettings';
import { TaskItem } from './TaskItem';
import { PlusIcon, MoreIcon, EditIcon, TrashIcon } from './Icons';
import { SimpleAddTaskForm } from './SimpleAddTaskForm';
import { DetailedAddTaskForm } from './DetailedAddTaskForm';
import { Popover } from './Popover';
import { AddTaskFormProps } from '../types';

interface KanbanViewProps extends Omit<AddTaskFormProps, 'onAddTask' | 'onDeactivate' | 'autoFocus'> {
    tasks: Task[];
    allTags: Tag[];
    settings: Settings;
    selectedTaskId: string | null;
    draggedId: string | null;
    dropTargetId: string | null;
    isDragDisabled: boolean;
    onToggleComplete: (taskId: string) => void;
    onSelect: (taskId: string, triggerRef: React.RefObject<HTMLElement>) => void;
    onDragStart: (id: string) => void;
    onDragEnter: (id: string) => void;
    onDrop: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    onToggleSectionCollapse: (sectionId: string) => void;
    onToggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
    onDelete: (taskId: string) => void;
    onGenerateSubtasks: (taskId: string, taskTitle: string) => Promise<void>;
    onSetRecurrence: (taskId: string, recurrence: Recurrence | null) => void;
    onWontDo: (taskId: string) => void;
    onRestore: (taskId: string) => void;
    onPermanentDelete: (taskId: string) => void;
    aiEnabled: boolean;
    showDetails: boolean;
    onAddTask: AddTaskFormProps['onAddTask'];
    onRenameSection: (sectionId: string, newName: string) => void;
    onDeleteSection: (sectionId: string) => void;
    onAddSection: (name: string) => void;
    isRealList: boolean;
}

const KanbanTaskItem: React.FC<Omit<React.ComponentProps<typeof TaskItem>, 'onSelect'> & { onSelect: (taskId: string, triggerRef: React.RefObject<HTMLElement>) => void }> = (props) => {
    const itemRef = React.useRef<HTMLDivElement>(null);
    return (
        <div ref={itemRef} className="bg-background-secondary hover:bg-kanban-hover rounded-lg shadow-sm hover:shadow-md transition-colors duration-200">
            <TaskItem {...props} onSelect={() => props.onSelect(props.task.id, itemRef)} containerClassName="hover:bg-transparent" />
        </div>
    );
}


export const KanbanView: React.FC<KanbanViewProps> = (props) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [addingToSectionId, setAddingToSectionId] = useState<string | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const menuTriggersRef = useRef<Record<string, HTMLButtonElement | null>>({});

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        const onWheel = (e: WheelEvent) => {
            if (e.deltaY === 0 || !e.shiftKey) return;
            e.preventDefault();
            element.scrollTo({
                left: element.scrollLeft + e.deltaY,
            });
        };

        element.addEventListener('wheel', onWheel);
        return () => element.removeEventListener('wheel', onWheel);
    }, []);
    
    const { sections, tasksBySection } = React.useMemo(() => {
        const sections: Task[] = [];
        const tasksBySection: Record<string, Task[]> = { 'no-section': [] };
        
        let currentSectionId: string | null = null;
        props.tasks.forEach(task => {
            if (task.isSection) {
                sections.push(task);
                tasksBySection[task.id] = [];
                currentSectionId = task.id;
            } else {
                const targetSectionId = currentSectionId || 'no-section';
                if (!tasksBySection[targetSectionId]) {
                     tasksBySection[targetSectionId] = [];
                }
                tasksBySection[targetSectionId].push(task);
            }
        });

        if (tasksBySection['no-section'].length > 0 && !sections.find(s => s.id === 'no-section')) {
            sections.unshift({ id: 'no-section', title: 'No Section', isSection: true, listId: props.tasks[0]?.listId || 'inbox' } as Task);
        }
        
        return { sections, tasksBySection };
    }, [props.tasks]);

    const handleRenameSection = (section: Task) => {
        const newName = prompt('Enter new section name:', section.title);
        if (newName && newName.trim() !== section.title) {
            props.onRenameSection(section.id, newName.trim());
        }
    };

    return (
        <div ref={scrollRef} className="flex h-full space-x-6 p-6 overflow-x-auto">
            {sections.map(section => {
                const columnTasks = tasksBySection[section.id] || [];
                const isInboxPrioritySection = section.id.startsWith('inbox-section-');
                return (
                    <div 
                        key={section.id} 
                        className="w-80 flex-shrink-0 flex flex-col h-full max-h-full"
                        onDragOver={props.isDragDisabled ? undefined : e => e.preventDefault()}
                        onDragEnter={props.isDragDisabled ? undefined : () => props.onDragEnter(section.id)}
                        onDrop={props.isDragDisabled ? undefined : props.onDrop}
                        onDragEnd={props.isDragDisabled ? undefined : props.onDragEnd}
                    >
                        <div className="flex justify-between items-center p-3 flex-shrink-0">
                            <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-content-primary">{section.title}</h3>
                                <span className="text-sm text-content-tertiary">{columnTasks.length}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button onClick={() => setAddingToSectionId(section.id)} className="p-1 rounded text-content-tertiary hover:bg-white/10 hover:text-content-primary"><PlusIcon className="h-5 w-5" /></button>
                                {!isInboxPrioritySection && section.id !== 'no-section' && (
                                    <>
                                        <button ref={el => { menuTriggersRef.current[section.id] = el; }} onClick={() => setActiveMenuId(prev => prev === section.id ? null : section.id)} className="p-1 rounded text-content-tertiary hover:bg-white/10 hover:text-content-primary"><MoreIcon className="w-4 h-4" /></button>
                                        <Popover isOpen={activeMenuId === section.id} onClose={() => setActiveMenuId(null)} triggerRef={{ current: menuTriggersRef.current[section.id]}} position="bottom-end">
                                            <div className="w-48 bg-[#2f2f2f] rounded-lg shadow-xl border border-border-primary p-2 text-white text-sm">
                                                <button onClick={() => { handleRenameSection(section); setActiveMenuId(null); }} className="w-full text-left flex items-center space-x-2 p-2 rounded hover:bg-[#3f3f3f]"><EditIcon /><span>Rename</span></button>
                                                <button onClick={() => { props.onDeleteSection(section.id); setActiveMenuId(null); }} className="w-full text-left flex items-center space-x-2 p-2 rounded text-red-500 hover:bg-red-500/10"><TrashIcon /><span>Delete Section</span></button>
                                            </div>
                                        </Popover>
                                    </>
                                )}
                            </div>
                        </div>
                        {addingToSectionId === section.id && (
                            <div className="px-3 pb-2">
                                {props.settings.taskInputStyle === 'simple' ? (
                                    <SimpleAddTaskForm
                                        {...props}
                                        onAddTask={(taskData) => {
                                            props.onAddTask({
                                                ...taskData,
                                                afterTaskId: taskData.afterTaskId || (section.id !== 'no-section' ? section.id : undefined),
                                            });
                                            setAddingToSectionId(null);
                                        }}
                                        onDeactivate={() => setAddingToSectionId(null)}
                                        autoFocus
                                    />
                                ) : (
                                     <DetailedAddTaskForm
                                        {...props}
                                        onAddTask={(taskData) => {
                                            props.onAddTask({
                                                ...taskData,
                                                afterTaskId: taskData.afterTaskId || (section.id !== 'no-section' ? section.id : undefined),
                                            });
                                            setAddingToSectionId(null);
                                        }}
                                        onDeactivate={() => setAddingToSectionId(null)}
                                        autoFocus
                                    />
                                )}
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
                             {columnTasks.map(task => (
                                <KanbanTaskItem 
                                    key={task.id} 
                                    task={task}
                                    onToggleComplete={props.onToggleComplete}
                                    onToggleSubtaskComplete={props.onToggleSubtaskComplete}
                                    onDelete={props.onDelete}
                                    onGenerateSubtasks={props.onGenerateSubtasks}
                                    onSetRecurrence={props.onSetRecurrence}
                                    onWontDo={props.onWontDo}
                                    onRestore={props.onRestore}
                                    onPermanentDelete={props.onPermanentDelete}
                                    aiEnabled={props.aiEnabled}
                                    onSelect={props.onSelect}
                                    settings={props.settings}
                                    allTags={props.allTags}
                                    showDetails={props.showDetails}
                                    isDragDisabled={props.isDragDisabled}
                                    onDragStart={() => props.onDragStart(task.id)}
                                    onDrop={props.onDrop}
                                    onDragEnter={() => props.onDragEnter(task.id)}
                                    onDragEnd={props.onDragEnd}
                                    isSelected={props.selectedTaskId === task.id}
                                    isDropTarget={props.dropTargetId === task.id}
                                />
                            ))}
                            {props.dropTargetId === section.id && props.draggedId && !columnTasks.some(t => t.id === props.draggedId) && (
                               <div className="h-20 rounded-lg bg-primary/10 border-2 border-dashed border-primary/50" />
                            )}
                        </div>
                    </div>
                );
            })}
            {props.isRealList && props.activeListId !== 'inbox' && (
                <div className="w-80 flex-shrink-0">
                    <button onClick={() => props.onAddSection("New Section")} className="w-full h-12 flex items-center justify-center p-3 rounded-xl text-content-secondary hover:bg-white/10 font-semibold bg-white/5 border-2 border-dashed border-white/10 transition-colors">
                        + New section
                    </button>
                </div>
            )}
        </div>
    );
};