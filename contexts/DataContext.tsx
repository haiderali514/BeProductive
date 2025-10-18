import React, { createContext, useContext, useCallback, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { List, Task, Priority, Recurrence, Subtask, Habit, PomodoroSession, UserProfile, UserTrait, TraitType, GoalSubtype, Countdown, Tag, Filter, FilterDateOption, Activity, ActivityType, LearningPlan } from '../types';
import { DEFAULT_LISTS, DEFAULT_TASKS, DEFAULT_HABITS, DEFAULT_POMODORO_SESSIONS, DEFAULT_USER_PROFILE, DEFAULT_COUNTDOWNS, DEFAULT_TAGS, DEFAULT_FILTERS } from '../constants';
import { generateSubtasks } from '../services/geminiService';
import { useSettings } from './SettingsContext';
import { useApiUsage } from './ApiUsageContext';

interface DataContextType {
    lists: List[];
    tasks: Task[];
    habits: Habit[];
    pomodoroSessions: PomodoroSession[];
    userProfile: UserProfile;
    countdowns: Countdown[];
    tags: Tag[];
    filters: Filter[];
    activities: Activity[];
    plans: LearningPlan[];
    handleAddPlan: (title: string, targetDate: string, skills: string[]) => void;
    handleUpdatePlan: (planId: string, updates: Partial<LearningPlan>) => void;
    handleDeletePlan: (planId: string) => void;
    handleAddList: (listData: { name: string; emoji: string; color: string; }) => void;
    handleUpdateList: (listId: string, updates: Partial<List>) => void;
    handleDeleteList: (listId: string) => void;
    handleAddTask: (taskData: { 
        title: string; 
        listId: string; 
        priority: Priority; 
        dueDate: string | null;
        startDate: string | null;
        isAllDay: boolean;
        recurrence: Recurrence | null; 
        reminder: string | null;
        tags: string[]; 
        isSection?: boolean;
        isCollapsed?: boolean;
        afterTaskId?: string;
    }) => Task;
    handleUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    handleToggleComplete: (taskId: string) => void;
    handleToggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
    handleAddSubtask: (taskId: string, subtaskTitle: string) => void;
    handleDeleteTask: (taskId: string) => void;
    handleSetRecurrence: (taskId: string, recurrence: Recurrence | null) => void;
    handleGenerateSubtasks: (taskId: string, taskTitle: string) => Promise<void>;
    handleAddPomodoroSession: (session: Omit<PomodoroSession, 'id'>) => void;
    handleToggleHabit: (habitId: string, date: string) => void;
    handleAddHabit: (habitData: { name: string; icon: string; period: 'Morning' | 'Afternoon' | 'Night' }) => void;
    handleUpdateProfile: (newProfileData: Partial<UserProfile>) => void;
    getTasksForPeriod: (period: 'today' | 'tomorrow' | 'this week') => Task[];
    findFreeSlots: (dateStr: string, durationMinutes: number) => string[];
    handleAddCountdown: (title: string, date: string) => void;
    handleDeleteCountdown: (id: string) => void;
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
    handleAddTag: (tagData: { name: string; color: string; parentId: string | null; }) => void;
    handleAddFilter: (filterData: Omit<Filter, 'id'>) => void;
    handleWontDoTask: (taskId: string) => void;
    handleRestoreTask: (taskId: string) => void;
    handlePermanentDeleteTask: (taskId: string) => void;
    handleEmptyTrash: () => void;
    handleReorderTask: (draggedTaskId: string, targetId: string, currentListId?: string) => void;
    handleReorderList: (draggedListId: string, targetListId: string) => void;
    handleReorderHabit: (draggedHabitId: string, targetHabitId: string) => void;
    handleReorderTag: (draggedTagId: string, targetTagId: string) => void;
    handleReorderFilter: (draggedFilterId: string, targetFilterId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const toYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const calculateCurrentStreak = (checkIns: string[]): number => {
    if (checkIns.length === 0) return 0;
    
    const checkInSet = new Set(checkIns);
    let streak = 0;
    
    // Start checking from today
    let currentDate = new Date();
    
    // If today is not checked, the streak might have ended yesterday. So, we start checking from yesterday.
    if (!checkInSet.has(toYYYYMMDD(currentDate))) {
        currentDate.setDate(currentDate.getDate() - 1);
    }

    // Now, walk backwards day by day
    while (checkInSet.has(toYYYYMMDD(currentDate))) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
};


export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { settings, playSound } = useSettings();
    const [, logApiCall] = useApiUsage();

    const [lists, setLists] = useLocalStorage<List[]>('lists', DEFAULT_LISTS);
    const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', DEFAULT_TASKS);
    const [habits, setHabits] = useLocalStorage<Habit[]>('habits', DEFAULT_HABITS);
    const [pomodoroSessions, setPomodoroSessions] = useLocalStorage<PomodoroSession[]>('pomodoroSessions', DEFAULT_POMODORO_SESSIONS);
    const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('userProfile', DEFAULT_USER_PROFILE);
    const [countdowns, setCountdowns] = useLocalStorage<Countdown[]>('countdowns', DEFAULT_COUNTDOWNS);
    const [tags, setTags] = useLocalStorage<Tag[]>('tags', DEFAULT_TAGS);
    const [filters, setFilters] = useLocalStorage<Filter[]>('filters', DEFAULT_FILTERS);
    const [activities, setActivities] = useLocalStorage<Activity[]>('activities', []);
    const [plans, setPlans] = useLocalStorage<LearningPlan[]>('learningPlans', []);

    useEffect(() => {
        // Data migration logic from old profile structure
    }, []);
    
    const logActivity = useCallback((listId: string, type: ActivityType, details: Activity['details']) => {
        const newActivity: Activity = {
            id: Date.now().toString() + Math.random(),
            listId,
            type,
            timestamp: Date.now(),
            details,
        };
        setActivities(prev => [newActivity, ...prev].slice(0, 200)); // Keep last 200 activities
    }, [setActivities]);

    const handleAddPlan = useCallback((title: string, targetDate: string, skills: string[]) => {
        const newPlan: LearningPlan = {
            id: Date.now().toString(),
            title,
            targetDate,
            skills,
            roadmap: [],
        };
        setPlans(prev => [...prev, newPlan]);
    }, [setPlans]);

    const handleUpdatePlan = useCallback((planId: string, updates: Partial<LearningPlan>) => {
        setPlans(prev => prev.map(p => (p.id === planId ? { ...p, ...updates } : p)));
    }, [setPlans]);

    const handleDeletePlan = useCallback((planId: string) => {
        setPlans(prev => prev.filter(p => p.id !== planId));
    }, [setPlans]);

    const handleAddList = useCallback((listData: { name: string; color: string; emoji: string; }) => {
        const newList: List = {
            id: Date.now().toString(),
            name: listData.name,
            color: listData.color,
            emoji: listData.emoji,
            isPinned: false
        };
        if (!lists.some(l => l.name.toLowerCase() === listData.name.toLowerCase())) {
            setLists(prev => [...prev, newList]);
            logActivity(newList.id, 'list_created', {});
        }
    }, [lists, setLists, logActivity]);

    const handleUpdateList = useCallback((listId: string, updates: Partial<List>) => {
        const originalList = lists.find(l => l.id === listId);
        if (originalList && updates.name && originalList.name !== updates.name) {
            logActivity(listId, 'list_renamed', { from: originalList.name, to: updates.name });
        }
        setLists(prev => prev.map(l => l.id === listId ? { ...l, ...updates } : l));
    }, [lists, setLists, logActivity]);

    const handleDeleteList = useCallback((listId: string) => {
        setLists(prev => prev.filter(l => l.id !== listId));
        setTasks(prev => prev.map(t => t.listId === listId ? { ...t, listId: 'inbox' } : t));
    }, [setLists, setTasks]);


    const handleAddTask = useCallback((taskData: Parameters<DataContextType['handleAddTask']>[0]) => {
        const { afterTaskId, ...restOfTaskData } = taskData;
        const newTask: Task = { 
            id: Date.now().toString(), 
            completed: false, 
            subtasks: [], 
            tags: restOfTaskData.tags || [], 
            description: '', 
            pinned: false,
            ...restOfTaskData 
        };
        setTasks(prev => {
            if (afterTaskId) {
                const newTasks = [...prev];
                const sectionHeaderIndex = newTasks.findIndex(t => t.id === afterTaskId);
                if (sectionHeaderIndex !== -1) {
                    const nextSectionHeaderIndex = newTasks.findIndex((t, i) => i > sectionHeaderIndex && t.isSection);
                    const insertionIndex = nextSectionHeaderIndex === -1 ? newTasks.length : nextSectionHeaderIndex;
                    newTasks.splice(insertionIndex, 0, newTask);
                    return newTasks;
                }
            }
            return [...prev, newTask];
        });
        if (!newTask.isSection) {
            logActivity(newTask.listId, 'task_added', { taskId: newTask.id, taskTitle: newTask.title });
        }
        return newTask;
    }, [setTasks, logActivity]);

    const handleUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
        setTasks(prev => {
            const taskIndex = prev.findIndex(t => t.id === taskId);
            if (taskIndex === -1) return prev;
    
            const originalTask = prev[taskIndex];
            const updatedTask = { ...originalTask, ...updates };
            
            // --- Logging Logic ---
            if (updates.completed === true && !originalTask.completed) {
                logActivity(originalTask.listId, 'task_completed', { taskId, taskTitle: originalTask.title });
            }
            if (updates.completed === false && originalTask.completed) {
                logActivity(originalTask.listId, 'task_uncompleted', { taskId, taskTitle: originalTask.title });
            }
            if (updates.title && updates.title !== originalTask.title) {
                logActivity(originalTask.listId, 'task_title_updated', { taskId, taskTitle: originalTask.title, from: originalTask.title, to: updates.title });
            }
            if (updates.listId && updates.listId !== originalTask.listId) {
                const fromList = lists.find(l => l.id === originalTask.listId)?.name || 'Unknown List';
                const toList = lists.find(l => l.id === updates.listId)?.name || 'Unknown List';
                // Log in the old list that it left
                logActivity(originalTask.listId, 'task_list_moved', { taskId, taskTitle: updatedTask.title, to: toList });
                // Log in the new list that it arrived
                logActivity(updates.listId, 'task_list_moved', { taskId, taskTitle: updatedTask.title, from: fromList });
            }
            // --- End Logging ---
    
            const newTasks = [...prev];
            newTasks[taskIndex] = updatedTask;
            return newTasks;
        });
    }, [setTasks, logActivity, lists]);

    const handleToggleComplete = useCallback((taskId: string) => {
        const taskToToggle = tasks.find(task => task.id === taskId);
        if (!taskToToggle) return;
        if (taskToToggle.recurrence && !taskToToggle.completed) {
            let nextDueDate: Date;
            if (taskToToggle.dueDate) {
                const datePart = taskToToggle.dueDate.split(' ')[0];
                const [year, month, day] = datePart.split('-').map(Number);
                if (isNaN(year) || isNaN(month) || isNaN(day)) {
                     console.error(`Invalid date format for recurring task: ${taskToToggle.dueDate}.`);
                     setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true, recurrence: null } : t));
                     return;
                }
                nextDueDate = new Date(Date.UTC(year, month - 1, day));
            } else {
                nextDueDate = new Date();
            }
            switch (taskToToggle.recurrence) {
                case Recurrence.DAILY: nextDueDate.setUTCDate(nextDueDate.getUTCDate() + 1); break;
                case Recurrence.WEEKLY: nextDueDate.setUTCDate(nextDueDate.getUTCDate() + 7); break;
                case Recurrence.MONTHLY: nextDueDate.setUTCMonth(nextDueDate.getUTCMonth() + 1); break;
                case Recurrence.YEARLY: nextDueDate.setUTCFullYear(nextDueDate.getUTCFullYear() + 1); break;
            }
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, dueDate: nextDueDate.toISOString().split('T')[0], subtasks: t.subtasks.map(st => ({...st, completed: false})) } : t));
        } else {
            if (!taskToToggle.completed) {
                playSound('completion');
                logActivity(taskToToggle.listId, 'task_completed', { taskId, taskTitle: taskToToggle.title });
            } else {
                 logActivity(taskToToggle.listId, 'task_uncompleted', { taskId, taskTitle: taskToToggle.title });
            }
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed, completionDate: !t.completed ? new Date().toISOString() : undefined, wontDo: false } : t));
        }
    }, [tasks, setTasks, playSound, logActivity]);

    const handleToggleSubtaskComplete = useCallback((taskId: string, subtaskId: string) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s) } : t));
    }, [setTasks]);

    const handleAddSubtask = useCallback((taskId: string, subtaskTitle: string) => {
        if (!subtaskTitle.trim()) return;
        const newSubtask: Subtask = {
            id: `${taskId}-${Date.now()}`,
            title: subtaskTitle.trim(),
            completed: false,
        };
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: [...t.subtasks, newSubtask] } : t));
    }, [setTasks]);

    const handleDeleteTask = useCallback((taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            logActivity(task.listId, 'task_deleted', { taskId: task.id, taskTitle: task.title });
        }
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, trashed: true } : t));
    }, [tasks, setTasks, logActivity]);

    const handlePermanentDeleteTask = useCallback((taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    }, [setTasks]);
    
    const handleEmptyTrash = useCallback(() => {
        setTasks(prev => prev.filter(t => !t.trashed));
    }, [setTasks]);

    const handleWontDoTask = useCallback((taskId: string) => {
        setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, wontDo: true, completed: false } : t)));
    }, [setTasks]);

    const handleRestoreTask = useCallback((taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            logActivity(task.listId, 'task_restored', { taskId, taskTitle: task.title });
        }
        setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, trashed: false, wontDo: false, completed: false } : t)));
    }, [tasks, setTasks, logActivity]);

    const handleSetRecurrence = useCallback((taskId: string, recurrence: Recurrence | null) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, recurrence } : t));
    }, [setTasks]);

    const handleGenerateSubtasks = useCallback(async (taskId: string, taskTitle: string) => {
        if (!settings.enableAIFeatures) throw new Error("AI features are disabled in settings.");
        const { data: titles, tokensUsed } = await generateSubtasks(taskTitle);
        logApiCall('generateSubtasks', tokensUsed);
        const newSubtasks: Subtask[] = titles.map(title => ({ id: `${taskId}-${Date.now()}-${Math.random()}`, title, completed: false }));
        setTasks(current => current.map(t => t.id === taskId ? { ...t, subtasks: [...t.subtasks, ...newSubtasks] } : t));
    }, [setTasks, settings.enableAIFeatures, logApiCall]);
    
    const handleAddPomodoroSession = useCallback((session: Omit<PomodoroSession, 'id'>) => {
        const newSession: PomodoroSession = { ...session, id: Date.now().toString() };
        setPomodoroSessions(prev => [newSession, ...prev].sort((a, b) => b.startTime - a.startTime));
    }, [setPomodoroSessions]);

    const handleToggleHabit = useCallback((habitId: string, date: string) => {
        setHabits(prev => {
            const newHabits = prev.map(h => {
                if (h.id === habitId) {
                    const isChecking = !h.checkIns.includes(date);
                    if (isChecking) {
                        playSound('completion');
                    }
                    const newCheckIns = isChecking 
                        ? [...h.checkIns, date] 
                        : h.checkIns.filter(d => d !== date);
                    
                    // Recalculate streak
                    const newStreak = calculateCurrentStreak(newCheckIns);
                    
                    return { ...h, checkIns: newCheckIns, streak: newStreak };
                }
                return h;
            });
            return newHabits;
        });
    }, [setHabits, playSound]);
    
    const handleAddHabit = useCallback((habitData: { name: string; icon: string; period: 'Morning' | 'Afternoon' | 'Night' }) => {
        const newHabit: Habit = {
            id: Date.now().toString(),
            name: habitData.name,
            icon: habitData.icon,
            period: habitData.period,
            checkIns: [],
            totalDays: 0,
            streak: 0,
        };
        setHabits(prev => [...prev, newHabit]);
    }, [setHabits]);

    const handleUpdateProfile = useCallback((newProfileData: Partial<UserProfile>) => {
        setUserProfile(prev => ({...prev, ...newProfileData}));
    }, [setUserProfile]);

    const getTasksForPeriod = useCallback((period: 'today' | 'tomorrow' | 'this week'): Task[] => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const activeTasks = tasks.filter(t => !t.completed && !t.trashed && !t.wontDo);
    
        if (period === 'today') {
            return activeTasks.filter(t => t.dueDate && t.dueDate.startsWith(todayStr));
        }
        if (period === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            return activeTasks.filter(t => t.dueDate && t.dueDate.startsWith(tomorrowStr));
        }
        if (period === 'this week') {
            const weekEnd = new Date();
            weekEnd.setDate(now.getDate() + 7);
            const weekEndStr = weekEnd.toISOString().split('T')[0];
            return activeTasks.filter(t => t.dueDate && t.dueDate >= todayStr && t.dueDate <= weekEndStr);
        }
        return [];
    }, [tasks]);

    const findFreeSlots = useCallback((dateStr: string, durationMinutes: number): string[] => {
        const targetDate = new Date(dateStr);
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 8, 0, 0); // 8 AM
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 22, 0, 0); // 10 PM
    
        const existingEvents = pomodoroSessions
            .filter(s => new Date(s.startTime).toISOString().split('T')[0] === dateStr)
            .map(s => ({ start: s.startTime, end: s.endTime }))
            .sort((a, b) => a.start - b.start);
    
        const freeSlots = [];
        let searchStart = startOfDay.getTime();
    
        for (const event of existingEvents) {
            if (event.start - searchStart >= durationMinutes * 60000) {
                freeSlots.push(`${new Date(searchStart).toLocaleTimeString()} - ${new Date(event.start).toLocaleTimeString()}`);
            }
            searchStart = Math.max(searchStart, event.end);
        }
    
        if (endOfDay.getTime() - searchStart >= durationMinutes * 60000) {
            freeSlots.push(`${new Date(searchStart).toLocaleTimeString()} - ${endOfDay.toLocaleTimeString()}`);
        }
    
        return freeSlots;
    }, [pomodoroSessions]);

    const handleAddCountdown = useCallback((title: string, date: string) => {
        const newCountdown: Countdown = { id: Date.now().toString(), title, date };
        setCountdowns(prev => [...prev, newCountdown]);
    }, [setCountdowns]);

    const handleDeleteCountdown = useCallback((id: string) => {
        setCountdowns(prev => prev.filter(cd => cd.id !== id));
    }, [setCountdowns]);
    
    const handleAddTag = useCallback((tagData: { name: string; color: string; parentId: string | null; }) => {
        const newTag: Tag = {
            id: Date.now().toString(),
            name: tagData.name,
            color: tagData.color,
            parentId: tagData.parentId,
        };
        if (!tags.some(t => t.name.toLowerCase() === newTag.name.toLowerCase())) {
            setTags(prev => [...prev, newTag]);
        }
    }, [tags, setTags]);

    const handleAddFilter = useCallback((filterData: Omit<Filter, 'id'>) => {
        const newFilter: Filter = { ...filterData, id: Date.now().toString() };
        setFilters(prev => [...prev, newFilter]);
    }, [setFilters]);

    const handleReorderTask = useCallback((draggedTaskId: string, targetId: string, currentListId?: string) => {
        // New logic for Inbox priority change on drag-drop
        if (currentListId === 'inbox') {
            const targetIsSection = targetId.startsWith('inbox-section-');
            const targetItem = tasks.find(t => t.id === targetId);

            if (!targetItem) return;

            let newPriority: Priority;
            if (targetIsSection) {
                if (targetId === 'inbox-section-high') newPriority = Priority.HIGH;
                else if (targetId === 'inbox-section-medium') newPriority = Priority.MEDIUM;
                else newPriority = Priority.LOW; // 'inbox-section-low'
            } else {
                newPriority = targetItem.priority;
            }

            const draggedTask = tasks.find(t => t.id === draggedTaskId);
            if (!draggedTask) return;
            
            const isSameGroup = 
                (draggedTask.priority === newPriority) ||
                ((draggedTask.priority === Priority.LOW || draggedTask.priority === Priority.NONE) && (newPriority === Priority.LOW || newPriority === Priority.NONE));

            if (!isSameGroup) {
                handleUpdateTask(draggedTaskId, { priority: newPriority });
                return; // State update will handle re-render, no manual reordering needed
            }
        }
    
        // Fall through to default reordering logic if it's within the same group, or not the inbox view.
        setTasks(currentTasks => {
            const tasks = [...currentTasks];
            const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
            if (draggedIndex === -1) {
                console.error("Dragged task not found, aborting reorder.");
                return currentTasks;
            }
            const [draggedItem] = tasks.splice(draggedIndex, 1);
            
            const targetIndex = tasks.findIndex(t => t.id === targetId);
            const targetItem = targetIndex !== -1 ? tasks[targetIndex] : null;

            if (targetItem && !targetItem.isSection) {
                draggedItem.listId = targetItem.listId;
                tasks.splice(targetIndex, 0, draggedItem);
                return tasks;
            }
            
            if (targetItem && targetItem.isSection) {
                const section = targetItem;
                draggedItem.listId = section.listId;
                let nextSectionIndex = -1;
                for (let i = targetIndex + 1; i < tasks.length; i++) {
                    if (tasks[i].isSection && tasks[i].listId === section.listId) {
                        nextSectionIndex = i;
                        break;
                    }
                }
                
                if (nextSectionIndex !== -1) {
                    tasks.splice(nextSectionIndex, 0, draggedItem);
                } else {
                    let lastTaskOfListIndex = -1;
                    for (let i = tasks.length - 1; i >= 0; i--) {
                        if (tasks[i].listId === section.listId) {
                            lastTaskOfListIndex = i;
                            break;
                        }
                    }
                    tasks.splice(lastTaskOfListIndex + 1, 0, draggedItem);
                }
                return tasks;
            }
            
            if (targetId === 'no-section' && currentListId) {
                draggedItem.listId = currentListId;
                const firstSectionIndex = tasks.findIndex(t => t.isSection && t.listId === currentListId);
                
                if (firstSectionIndex !== -1) {
                    tasks.splice(firstSectionIndex, 0, draggedItem);
                } else {
                    let lastTaskOfListIndex = -1;
                    for (let i = tasks.length - 1; i >= 0; i--) {
                        if (tasks[i].listId === currentListId) {
                            lastTaskOfListIndex = i;
                            break;
                        }
                    }
                    tasks.splice(lastTaskOfListIndex + 1, 0, draggedItem);
                }
                return tasks;
            }
    
            console.warn("Could not determine drop location, reverting.");
            tasks.splice(draggedIndex, 0, draggedItem);
            return tasks;
        });
    }, [setTasks, tasks, handleUpdateTask]);

    const handleReorderList = useCallback((draggedListId: string, targetListId: string) => {
        setLists(prev => {
            const draggedIndex = prev.findIndex(l => l.id === draggedListId);
            const targetIndex = prev.findIndex(l => l.id === targetListId);
            if (draggedIndex === -1 || targetIndex === -1) return prev;
            
            const newLists = [...prev];
            const [draggedItem] = newLists.splice(draggedIndex, 1);
            newLists.splice(targetIndex, 0, draggedItem);
            return newLists;
        });
    }, [setLists]);

    const handleReorderHabit = useCallback((draggedHabitId: string, targetHabitId: string) => {
        setHabits(prev => {
            const draggedIndex = prev.findIndex(h => h.id === draggedHabitId);
            let targetIndex = prev.findIndex(h => h.id === targetHabitId);
    
            if (draggedIndex === -1 || targetIndex === -1) return prev;
    
            const newHabits = [...prev];
            const [draggedHabit] = newHabits.splice(draggedIndex, 1);
            
            if (draggedIndex < targetIndex) {
                targetIndex--;
            }
            
            newHabits.splice(targetIndex, 0, draggedHabit);

            const targetHabitInOriginalArray = prev.find(h => h.id === targetHabitId);
            const targetPeriod = targetHabitInOriginalArray?.period;
            
            if (targetPeriod && draggedHabit.period !== targetPeriod) {
                const updatedDraggedHabit = { ...draggedHabit, period: targetPeriod };
                newHabits.splice(targetIndex, 1, updatedDraggedHabit);
            }
            
            return newHabits;
        });
    }, [setHabits]);

    const handleReorderTag = useCallback((draggedTagId: string, targetTagId: string) => {
        setTags(prev => {
            const draggedIndex = prev.findIndex(t => t.id === draggedTagId);
            const targetIndex = prev.findIndex(t => t.id === targetTagId);
            if (draggedIndex === -1 || targetIndex === -1) return prev;
            
            const newTags = [...prev];
            const [draggedItem] = newTags.splice(draggedIndex, 1);
            newTags.splice(targetIndex, 0, draggedItem);
            return newTags;
        });
    }, [setTags]);

    const handleReorderFilter = useCallback((draggedFilterId: string, targetFilterId: string) => {
        setFilters(prev => {
            const draggedIndex = prev.findIndex(f => f.id === draggedFilterId);
            const targetIndex = prev.findIndex(f => f.id === targetFilterId);
            if (draggedIndex === -1 || targetIndex === -1) return prev;
            
            const newFilters = [...prev];
            const [draggedItem] = newFilters.splice(draggedIndex, 1);
            newFilters.splice(targetIndex, 0, draggedItem);
            return newFilters;
        });
    }, [setFilters]);

    const value = { lists, tasks, habits, pomodoroSessions, userProfile, countdowns, tags, filters, activities, plans, handleAddPlan, handleUpdatePlan, handleDeletePlan, handleAddList, handleUpdateList, handleDeleteList, handleAddTask, handleUpdateTask, handleToggleComplete, handleToggleSubtaskComplete, handleAddSubtask, handleDeleteTask, handleSetRecurrence, handleGenerateSubtasks, handleAddPomodoroSession, handleToggleHabit, handleAddHabit, handleUpdateProfile, getTasksForPeriod, findFreeSlots, handleAddCountdown, handleDeleteCountdown, setUserProfile, handleAddTag, handleAddFilter, handleWontDoTask, handleRestoreTask, handlePermanentDeleteTask, handleEmptyTrash, handleReorderTask, handleReorderList, handleReorderHabit, handleReorderTag, handleReorderFilter };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};