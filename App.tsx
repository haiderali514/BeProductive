import React, { useState, useCallback } from 'react';
import { List, Task, Priority, Subtask, Habit, PomodoroSession, Recurrence } from './types';
import { Sidebar } from './components/Sidebar';
import { TasksPage } from './components/TasksPage';
import { HabitPage } from './components/HabitPage';
import { PomodoroPage } from './components/PomodoroPage';
import { generateSubtasks } from './services/geminiService';
import useLocalStorage from './hooks/useLocalStorage';
import { DEFAULT_LISTS, DEFAULT_TASKS, DEFAULT_HABITS, DEFAULT_POMODORO_SESSIONS } from './constants';

type ActiveView = 'tasks' | 'pomodoro' | 'habits' | 'settings';

const App: React.FC = () => {
    const [lists, setLists] = useLocalStorage<List[]>('lists', DEFAULT_LISTS);
    const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', DEFAULT_TASKS);
    const [habits, setHabits] = useLocalStorage<Habit[]>('habits', DEFAULT_HABITS);
    const [pomodoroSessions, setPomodoroSessions] = useLocalStorage<PomodoroSession[]>('pomodoroSessions', DEFAULT_POMODORO_SESSIONS);

    const [activeView, setActiveView] = useState<ActiveView>('pomodoro');

    const handleAddList = useCallback((listName: string) => {
        if (lists.some(l => l.name.toLowerCase() === listName.toLowerCase())) {
            alert("A list with this name already exists.");
            return;
        }
        const newList: List = { id: Date.now().toString(), name: listName };
        setLists(prevLists => [...prevLists, newList]);
    }, [lists, setLists]);

    const handleAddTask = useCallback((taskData: { title: string; listId: string; priority: Priority; dueDate: string | null; recurrence: Recurrence | null; }) => {
        const newTask: Task = {
            id: Date.now().toString(),
            ...taskData,
            completed: false,
            subtasks: [],
        };
        setTasks(prevTasks => [...prevTasks, newTask]);
    }, [setTasks]);

    const handleToggleComplete = useCallback((taskId: string) => {
        const taskToToggle = tasks.find(task => task.id === taskId);
        if (!taskToToggle) return;

        // If it's a recurring task, completing it moves it to the next date
        if (taskToToggle.recurrence && !taskToToggle.completed) {
            let nextDueDate: Date;

            if (taskToToggle.dueDate) {
                // Parse date as UTC to avoid timezone issues
                const [year, month, day] = taskToToggle.dueDate.split('-').map(Number);
                nextDueDate = new Date(Date.UTC(year, month - 1, day));
            } else {
                // if no due date, start from today
                const today = new Date();
                nextDueDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
            }
            
            switch (taskToToggle.recurrence) {
                case Recurrence.DAILY:
                    nextDueDate.setUTCDate(nextDueDate.getUTCDate() + 1);
                    break;
                case Recurrence.WEEKLY:
                    nextDueDate.setUTCDate(nextDueDate.getUTCDate() + 7);
                    break;
                case Recurrence.MONTHLY:
                    nextDueDate.setUTCMonth(nextDueDate.getUTCMonth() + 1);
                    break;
                case Recurrence.YEARLY:
                    nextDueDate.setUTCFullYear(nextDueDate.getUTCFullYear() + 1);
                    break;
            }
            
            setTasks(prevTasks => prevTasks.map(task => 
                task.id === taskId 
                ? { 
                    ...task, 
                    dueDate: nextDueDate.toISOString().split('T')[0],
                    // Reset subtasks for the next occurrence
                    subtasks: task.subtasks.map(st => ({...st, completed: false}))
                  } 
                : task
            ));
        } else {
            // Otherwise, just toggle completion state
            setTasks(prevTasks => prevTasks.map(task => 
                task.id === taskId ? { ...task, completed: !task.completed } : task
            ));
        }
    }, [tasks, setTasks]);
    
    const handleToggleSubtaskComplete = useCallback((taskId: string, subtaskId: string) => {
        setTasks(prevTasks => prevTasks.map(task => {
            if (task.id === taskId) {
                return {
                    ...task,
                    subtasks: task.subtasks.map(sub => sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub)
                };
            }
            return task;
        }));
    }, [setTasks]);

    const handleDeleteTask = useCallback((taskId: string) => {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    }, [setTasks]);
    
    const handleSetRecurrence = useCallback((taskId: string, recurrence: Recurrence | null) => {
        setTasks(prevTasks => prevTasks.map(task => 
            task.id === taskId ? { ...task, recurrence } : task
        ));
    }, [setTasks]);

    const handleGenerateSubtasks = useCallback(async (taskId: string, taskTitle: string) => {
        const newSubtaskTitles = await generateSubtasks(taskTitle);
        const newSubtasks: Subtask[] = newSubtaskTitles.map(title => ({
            id: `${taskId}-${Date.now()}-${Math.random()}`,
            title,
            completed: false,
        }));

        setTasks(currentTasks => currentTasks.map(task => 
            task.id === taskId 
                ? { ...task, subtasks: [...task.subtasks, ...newSubtasks] } 
                : task
        ));
    }, [setTasks]);
    
    const handleAddPomodoroSession = useCallback((session: Omit<PomodoroSession, 'id'>) => {
        const newSession: PomodoroSession = { ...session, id: Date.now().toString() };
        setPomodoroSessions(prev => [newSession, ...prev].sort((a, b) => b.startTime - a.startTime));
    }, [setPomodoroSessions]);

    const handleToggleHabit = useCallback((habitId: string, date: string) => {
        setHabits(prevHabits => prevHabits.map(h => {
            if (h.id === habitId) {
                const newCheckIns = h.checkIns.includes(date)
                    ? h.checkIns.filter(d => d !== date)
                    : [...h.checkIns, date];
                // Note: Streak and totalDays are calculated in the stats panel now.
                // These base values are from the seed data and aren't dynamically updated.
                return { ...h, checkIns: newCheckIns };
            }
            return h;
        }));
    }, [setHabits]);

    const handleAddHabit = useCallback((habitData: { name: string; icon: string; period: 'Morning' | 'Afternoon' | 'Night' }) => {
        const newHabit: Habit = {
            id: Date.now().toString(),
            ...habitData,
            checkIns: [],
            totalDays: 0,
            streak: 0,
        };
        setHabits(prevHabits => [...prevHabits, newHabit]);
    }, [setHabits]);

    const renderActiveView = () => {
        switch (activeView) {
            case 'tasks':
                return <TasksPage
                    lists={lists}
                    tasks={tasks}
                    onAddTask={handleAddTask}
                    onAddList={handleAddList}
                    onDeleteTask={handleDeleteTask}
                    onGenerateSubtasks={handleGenerateSubtasks}
                    onToggleComplete={handleToggleComplete}
                    onToggleSubtaskComplete={handleToggleSubtaskComplete}
                    onSetRecurrence={handleSetRecurrence}
                 />;
            case 'habits':
                return <HabitPage habits={habits} onToggleHabit={handleToggleHabit} onAddHabit={handleAddHabit} />;
            case 'pomodoro':
                return <PomodoroPage 
                    sessions={pomodoroSessions}
                    onAddSession={handleAddPomodoroSession}
                    tasks={tasks}
                    habits={habits}
                />;
            case 'settings':
                return <div className="p-6 text-content-primary"><h1 className="text-2xl font-bold">Settings</h1><p>Settings page is under construction.</p></div>;
            default:
                return <div className="p-6 text-content-primary"><h1 className="text-2xl font-bold">Not Found</h1></div>;
        }
    }

    return (
        <div className="flex h-screen font-sans text-content-primary bg-background-primary">
            <Sidebar 
                activeView={activeView}
                setActiveView={setActiveView}
            />
            <main className="flex-1 flex flex-col">
                {renderActiveView()}
            </main>
        </div>
    );
};

export default App;