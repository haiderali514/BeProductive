import React, { createContext, useContext, useCallback, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { List, Task, Priority, Recurrence, Subtask, Habit, PomodoroSession, UserProfile, UserTrait, TraitType, GoalSubtype, Countdown, Tag, Filter, FilterDateOption } from '../types';
import { DEFAULT_LISTS, DEFAULT_TASKS, DEFAULT_HABITS, DEFAULT_POMODORO_SESSIONS, DEFAULT_USER_PROFILE, DEFAULT_COUNTDOWNS } from '../constants';
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
    const [tags, setTags] = useLocalStorage<Tag[]>('tags', []);
    const [filters, setFilters] = useLocalStorage<Filter[]>('filters', []);

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


    const handleAddTask = useCallback((taskData: { title: string; listId: string; priority: Priority; dueDate: string | null; recurrence: Recurrence | null; tags: string[]; isSection?: boolean, isCollapsed?: boolean }) => {
        const newTask: Task = { 
            id: Date.now().toString(), 
            completed: false, 
            subtasks: [], 
            tags: taskData.tags || [], 
            description: '', 
            pinned: false,
            ...taskData 
        };
        setTasks(prev => [...prev, newTask]);
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
                    
                    const newStreak = calculateCurrentStreak(newCheckIns);

                    return { ...h, checkIns: newCheckIns, streak: newStreak };
                }
                return h;
            });
            return newHabits;
        });
    }, [setHabits, playSound]);


    const handleAddHabit = useCallback((habitData: { name: string; icon: string; period: 'Morning' | 'Afternoon' | 'Night' }) => {
        const newHabit: Habit = { id: Date.now().toString(), ...habitData, checkIns: [], totalDays: 0, streak: 0 };
        setHabits(prev => [...prev, newHabit]);
    }, [setHabits]);
    
    const handleUpdateProfile = useCallback((newProfileData: Partial<UserProfile>) => {
        setUserProfile(prev => ({...prev, ...newProfileData}));
    }, [setUserProfile]);

    const getTasksForPeriod = useCallback((period: 'today' | 'tomorrow' | 'this week') => {
        const activeTasks = tasks.filter(t => !t.completed && !t.wontDo && !t.trashed);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        switch(period) {
            case 'today':
                return activeTasks.filter(t => t.dueDate && t.dueDate.startsWith(todayStr));
            case 'tomorrow':
                return activeTasks.filter(t => t.dueDate && t.dueDate.startsWith(tomorrowStr));
            case 'this week':
                const startDayIndex = settings.startWeekOn === 'monday' ? 1 : (settings.startWeekOn === 'saturday' ? 6 : 0);
                const currentDay = today.getDay();
                const weekStart = new Date(today);
                const diff = currentDay - startDayIndex;
                weekStart.setDate(today.getDate() - (diff < 0 ? diff + 7 : diff));

                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                return activeTasks.filter(t => {
                    if (!t.dueDate) return false;
                    const taskDate = new Date(t.dueDate.split(' ')[0] + 'T00:00:00');
                    return taskDate >= weekStart && taskDate <= weekEnd;
                });
            default:
                return [];
        }
    }, [tasks, settings.startWeekOn]);

    const findFreeSlots = useCallback((dateStr: string, durationMinutes: number) => {
        const targetDate = new Date(dateStr + 'T00:00:00');
        targetDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate);
        nextDay.setDate(targetDate.getDate() + 1);

        const daySessions = pomodoroSessions
            .filter(s => s.startTime >= targetDate.getTime() && s.startTime < nextDay.getTime())
            .sort((a, b) => a.startTime - b.startTime);
        
        const slots = [];
        // Check from 9 AM to 9 PM
        let searchStart = new Date(targetDate);
        searchStart.setHours(9, 0, 0, 0);

        const dayEnd = new Date(targetDate);
        dayEnd.setHours(21, 0, 0, 0);

        for (const session of daySessions) {
            if (session.startTime > searchStart.getTime()) {
                const gap = session.startTime - searchStart.getTime();
                if (gap >= durationMinutes * 60 * 1000) {
                    slots.push(`${searchStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
                }
            }
            searchStart = new Date(session.endTime);
        }

        if (dayEnd.getTime() > searchStart.getTime()) {
            const lastGap = dayEnd.getTime() - searchStart.getTime();
            if (lastGap >= durationMinutes * 60 * 1000) {
                slots.push(`${searchStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${dayEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
            }
        }

        return slots;
    }, [pomodoroSessions]);

    const handleAddCountdown = useCallback((title: string, date: string) => {
        const newCountdown: Countdown = { id: Date.now().toString(), title, date };
        setCountdowns(prev => [...prev, newCountdown]);
    }, [setCountdowns]);

    const handleDeleteCountdown = useCallback((id: string) => {
        setCountdowns(prev => prev.filter(cd => cd.id !== id));
    }, [setCountdowns]);

    const handleAddTag = useCallback((tagData: { name: string; color: string; parentId: string | null; }) => {
        const newTag: Tag = { id: Date.now().toString(), ...tagData };
        setTags(prev => [...prev, newTag]);
    }, [setTags]);

    const handleAddFilter = useCallback((filterData: Omit<Filter, 'id'>) => {
        const newFilter: Filter = { id: Date.now().toString(), ...filterData };
        setFilters(prev => [...prev, newFilter]);
    }, [setFilters]);

    const reorderArray = <T extends { id: string }>(items: T[], draggedId: string, targetId: string): T[] => {
        const draggedItem = items.find(item => item.id === draggedId);
        if (!draggedItem) return items;

        const remainingItems = items.filter(item => item.id !== draggedId);
        
        const targetIndex = remainingItems.findIndex(item => item.id === targetId);
        if (targetIndex === -1) return items; // Should not happen

        remainingItems.splice(targetIndex, 0, draggedItem);
        return remainingItems;
    };

    const handleReorderTask = useCallback((draggedTaskId: string, targetTaskId: string) => {
        setTasks(prev => reorderArray(prev, draggedTaskId, targetTaskId));
    }, [setTasks]);

    const handleReorderList = useCallback((draggedListId: string, targetListId: string) => {
        setLists(prev => reorderArray(prev, draggedListId, targetListId));
    }, [setLists]);

    const handleReorderHabit = useCallback((draggedHabitId: string, targetHabitId: string) => {
        setHabits(prev => reorderArray(prev, draggedHabitId, targetHabitId));
    }, [setHabits]);

    const value = {
        lists, tasks, habits, pomodoroSessions, userProfile, countdowns, tags, filters,
        handleAddList, handleUpdateList, handleDeleteList,
        handleAddTask, handleUpdateTask, handleToggleComplete, handleToggleSubtaskComplete,
        handleAddSubtask, handleDeleteTask, handleSetRecurrence, handleGenerateSubtasks, handleAddPomodoroSession,
        handleToggleHabit, handleAddHabit, handleUpdateProfile, getTasksForPeriod, findFreeSlots,
        handleAddCountdown, handleDeleteCountdown, setUserProfile,
        handleAddTag, handleAddFilter,
        handleWontDoTask, handleRestoreTask, handlePermanentDeleteTask, handleEmptyTrash,
        handleReorderTask, handleReorderList, handleReorderHabit,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
