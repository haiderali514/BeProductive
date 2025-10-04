import React, { useState, useMemo } from 'react';
import { List, Task, Priority, Recurrence } from '../types';
import { TaskItem } from './TaskItem';
import { SmartAddTaskForm } from './SmartAddTaskForm';
import { PlanWithAIModal } from './PlanWithAIModal';
import { AITaskSuggestion } from '../services/geminiService';

interface TasksPageProps {
  lists: List[];
  tasks: Task[];
  onAddList: (listName: string) => void;
  onAddTask: (taskData: { title: string; listId: string; priority: Priority; dueDate: string | null; recurrence: Recurrence | null; }) => void;
  onToggleComplete: (taskId: string) => void;
  onToggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onGenerateSubtasks: (taskId: string, taskTitle: string) => Promise<void>;
  onSetRecurrence: (taskId: string, recurrence: Recurrence | null) => void;
}

export const TasksPage: React.FC<TasksPageProps> = (props) => {
    const { lists, tasks, onAddList, onAddTask, onToggleComplete, onToggleSubtaskComplete, onDeleteTask, onGenerateSubtasks, onSetRecurrence } = props;
    const [activeListId, setActiveListId] = useState('inbox');
    const [newListName, setNewListName] = useState('');
    const [isAddingList, setIsAddingList] = useState(false);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

    const filteredTasks = useMemo(() => {
        let tasksToShow;

        if (activeListId === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            tasksToShow = tasks.filter(task => {
                if (!task.dueDate) return false;
                // Robustly parse date and normalize to the start of the day for comparison
                const taskDate = new Date(task.dueDate.replace(' ', 'T'));
                if (isNaN(taskDate.getTime())) return false;
                taskDate.setHours(0, 0, 0, 0);
                
                return taskDate.getTime() === today.getTime();
            });
        } else {
            tasksToShow = tasks.filter(task => task.listId === activeListId);
        }

        return [...tasksToShow].sort((a, b) => {
            // Sort by completion status first (incomplete tasks first)
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }

            // Then sort by full due date and time (earlier first)
            const aDate = a.dueDate ? new Date(a.dueDate.replace(' ', 'T')) : null;
            const bDate = b.dueDate ? new Date(b.dueDate.replace(' ', 'T')) : null;

            const aTime = aDate && !isNaN(aDate.getTime()) ? aDate.getTime() : Infinity;
            const bTime = bDate && !isNaN(bDate.getTime()) ? bDate.getTime() : Infinity;

            return aTime - bTime;
        });
    }, [tasks, activeListId]);

    const activeListName = useMemo(() => {
        if (activeListId === 'today') return 'Today';
        return lists.find(l => l.id === activeListId)?.name || 'Inbox';
    }, [lists, activeListId]);
    
    const handleAddList = (e: React.FormEvent) => {
        e.preventDefault();
        if (newListName.trim()) {
            onAddList(newListName.trim());
            setNewListName('');
            setIsAddingList(false);
        }
    };

    const handleAddTaskPlan = (plan: AITaskSuggestion[]) => {
        plan.forEach(suggestedTask => {
            const list = lists.find(l => l.name.toLowerCase() === suggestedTask.listName.toLowerCase()) || lists.find(l => l.id === 'inbox');
            onAddTask({
                title: suggestedTask.title,
                listId: list!.id,
                priority: Priority.NONE,
                dueDate: null,
                recurrence: null
            });
        });
        setIsPlanModalOpen(false);
    };

    return (
        <>
            <div className="flex h-full">
                <div className="w-72 bg-background-secondary border-r border-border-primary flex flex-col p-4">
                     <h2 className="text-xl font-bold text-content-primary mb-4">Tasks</h2>
                     <nav className="flex flex-col space-y-1">
                         <a href="#" onClick={() => setActiveListId('inbox')} className={`px-3 py-2 rounded-md text-sm ${activeListId === 'inbox' ? 'bg-primary/20 text-primary' : 'hover:bg-background-tertiary'}`}>Inbox</a>
                         <a href="#" onClick={() => setActiveListId('today')} className={`px-3 py-2 rounded-md text-sm ${activeListId === 'today' ? 'bg-primary/20 text-primary' : 'hover:bg-background-tertiary'}`}>Today</a>
                         <div className="pt-4 mt-2 border-t border-border-primary">
                             <div className="flex justify-between items-center mb-2 px-3">
                                 <h3 className="text-xs font-semibold uppercase text-content-secondary">Lists</h3>
                                 <button onClick={() => setIsAddingList(!isAddingList)} className="text-content-secondary hover:text-primary p-1 rounded-full">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                 </button>
                             </div>
                             {lists.filter(l => l.id !== 'inbox').map(list => (
                                <a key={list.id} href="#" onClick={() => setActiveListId(list.id)} className={`px-3 py-2 rounded-md text-sm truncate ${activeListId === list.id ? 'bg-primary/20 text-primary' : 'hover:bg-background-tertiary'}`}>{list.name}</a>
                             ))}
                             {isAddingList && (
                                 <form onSubmit={handleAddList} className="px-3 mt-2">
                                    <input
                                        type="text"
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                        placeholder="New list name"
                                        className="w-full bg-background-primary border border-border-primary rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                        autoFocus
                                    />
                                 </form>
                             )}
                         </div>
                     </nav>
                </div>
                <div className="flex-1 flex flex-col">
                    <header className="p-6 border-b border-border-primary flex justify-between items-center">
                        <h2 className="text-2xl font-bold">{activeListName}</h2>
                        <button 
                            onClick={() => setIsPlanModalOpen(true)}
                            className="px-4 py-2 bg-primary/20 text-primary rounded-lg font-semibold hover:bg-primary/30 transition-colors flex items-center space-x-2"
                        >
                            <span>Plan with AI ✨</span>
                        </button>
                    </header>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {filteredTasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onToggleComplete={onToggleComplete}
                                onToggleSubtaskComplete={onToggleSubtaskComplete}
                                onDelete={onDeleteTask}
                                onGenerateSubtasks={onGenerateSubtasks}
                                onSetRecurrence={onSetRecurrence}
                            />
                        ))}
                        {filteredTasks.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-content-secondary">No tasks here. Add one below!</p>
                            </div>
                        )}
                    </div>
                    <SmartAddTaskForm lists={lists} onAddTask={onAddTask} />
                </div>
            </div>
            {isPlanModalOpen && (
                <PlanWithAIModal
                    isOpen={isPlanModalOpen}
                    onClose={() => setIsPlanModalOpen(false)}
                    lists={lists}
                    onAddPlan={handleAddTaskPlan}
                />
            )}
        </>
    );
};