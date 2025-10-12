import React, { createContext, useContext, useCallback, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { List, Task, Priority, Recurrence, Subtask, Habit, PomodoroSession, UserProfile, UserTrait, TraitType, GoalSubtype, Countdown, Tag, Filter, FilterDateOption } from '../types';
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
    handleAddList: (listData: { name: string; emoji: string; color: string; }) => void;
    handleUpdateList: (listId: string, updates: Partial<List>) => void;
    handleDeleteList: (listId: string) => void;
    handleAddTask: (taskData: { 
        title: string; 
        listId: string; 
        priority: Priority; 
        dueDate: string | null; 
        recurrence: Recurrence | null; 
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
    handleReorderTask: (draggedTaskId: string, targetTaskId: string) => void;
    handleReorderList: (draggedListId: string, targetListId: string) => void;
    handleReorderHabit: (draggedHabitId: string, targetHabitId: string) => void;
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

    useEffect(() => {
        // Data migration logic from old profile structure
    }, []);

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
        }
    }, [lists, setLists]);

    const handleUpdateList = useCallback((listId: string, updates: Partial<List>) => {
        setLists(prev => prev.map(l => l.id === listId ? { ...l, ...updates } : l));
    }, [setLists]);

    const handleDeleteList = useCallback((listId: string) => {
        setLists(prev => prev.filter(l => l.id !== listId));
        setTasks(prev => prev.map(t => t.listId === listId ? { ...t, listId: 'inbox' } : t));
    }, [setLists, setTasks]);


    const handleAddTask = useCallback((taskData: { title: string; listId: string; priority: Priority; dueDate: string | null; recurrence: Recurrence | null; tags: string[]; isSection?: boolean, isCollapsed?: boolean, afterTaskId?: string }) => {
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
                const targetIndex = newTasks.findIndex(t => t.id === afterTaskId);
                if (targetIndex !== -1) {
                    newTasks.splice(targetIndex + 1, 0, newTask);
                    return newTasks;
                }
            }
            return [...prev, newTask];
        });
        return newTask;
    }, [setTasks]);

    const handleUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                return { ...t, ...updates };
            }
            return t;
        }));
    }, [setTasks]);

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
            }
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed, completionDate: !t.completed ? new Date().toISOString() : undefined, wontDo: false } : t));
        }
    }, [tasks, setTasks, playSound]);

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
        // Soft delete: move to trash
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, trashed: true } : t));
    }, [setTasks]);

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
        setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, trashed: false, wontDo: false, completed: false } : t)));
    }, [setTasks]);

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

    const handleReorderTask = useCallback((draggedTaskId: string, targetTaskId: string) => {
        setTasks(prev => {
            const tasks = [...prev];
            const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
            const targetIndex = tasks.findIndex(t => t.id === targetTaskId);
    
            if (draggedIndex === -1 || targetIndex === -1) return prev;
    
            const [draggedItem] = tasks.splice(draggedIndex, 1);
            const targetItem = prev[targetIndex]; // Use original array to find target properties
    
            if (targetItem.isSection) {
                draggedItem.listId = targetItem.listId;
                draggedItem.pinned = false;
            } else {
                draggedItem.listId = targetItem.listId;
                draggedItem.pinned = targetItem.pinned;
            }
    
            // Find the new index of the target in the modified array
            const newTargetIndex = tasks.findIndex(t => t.id === targetTaskId);
            tasks.splice(newTargetIndex, 0, draggedItem);
    
            return tasks;
        });
    }, [setTasks]);

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

    const value = { lists, tasks, habits, pomodoroSessions, userProfile, countdowns, tags, filters, handleAddList, handleUpdateList, handleDeleteList, handleAddTask, handleUpdateTask, handleToggleComplete, handleToggleSubtaskComplete, handleAddSubtask, handleDeleteTask, handleSetRecurrence, handleGenerateSubtasks, handleAddPomodoroSession, handleToggleHabit, handleAddHabit, handleUpdateProfile, getTasksForPeriod, findFreeSlots, handleAddCountdown, handleDeleteCountdown, setUserProfile, handleAddTag, handleAddFilter, handleWontDoTask, handleRestoreTask, handlePermanentDeleteTask, handleEmptyTrash, handleReorderTask, handleReorderList, handleReorderHabit };

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