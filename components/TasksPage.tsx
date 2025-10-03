
import React, { useState, useMemo } from 'react';
import { List, Task, Priority } from '../types';
import { TaskItem } from './TaskItem';
import { SmartAddTaskForm } from './SmartAddTaskForm';

interface TasksPageProps {
  lists: List[];
  tasks: Task[];
  onAddList: (listName: string) => void;
  onAddTask: (taskData: { title: string; listId: string; priority: Priority; dueDate: string | null; }) => void;
  onToggleComplete: (taskId: string) => void;
  onToggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onGenerateSubtasks: (taskId: string, taskTitle: string) => Promise<void>;
}

export const TasksPage: React.FC<TasksPageProps> = (props) => {
    const { lists, tasks, onAddList, onAddTask, onToggleComplete, onToggleSubtaskComplete, onDeleteTask, onGenerateSubtasks } = props;
    const [activeListId, setActiveListId] = useState('inbox');
    const [newListName, setNewListName] = useState('');
    const [isAddingList, setIsAddingList] = useState(false);

    const isDateToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    const filteredTasks = useMemo(() => {
        let tasksToShow = tasks;
        if (activeListId === 'today') {
            tasksToShow = tasks.filter(task => task.dueDate && isDateToday(new Date(task.dueDate)));
        } else {
            tasksToShow = tasks.filter(task => task.listId === activeListId);
        }
        return tasksToShow.sort((a,b) => (a.completed ? 1 : -1) - (b.completed ? 1 : -1) || (new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()));
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

    return (
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
                <header className="p-6 border-b border-border-primary">
                    <h2 className="text-2xl font-bold">{activeListName}</h2>
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
    );
};
