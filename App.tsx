
import React, { useState, useCallback } from 'react';
import { List, Task, Priority, Subtask, Habit, PomodoroSession, Recurrence } from './types';
import { Sidebar } from './components/Sidebar';
import { TasksPage } from './components/TasksPage';
import { HabitPage } from './components/HabitPage';
import { PomodoroPage } from './components/PomodoroPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { generateSubtasks } from './services/geminiService';
import useLocalStorage from './hooks/useLocalStorage';
import { DEFAULT_LISTS, DEFAULT_TASKS, DEFAULT_HABITS, DEFAULT_POMODORO_SESSIONS } from './constants';
import { LandingPage } from './components/auth/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { SettingsModal } from './components/settings/SettingsModal';
import { useSettings, Settings } from './hooks/useSettings';


type ActiveView = 'tasks' | 'pomodoro' | 'habits' | 'analytics';
type AuthView = 'landing' | 'login' | 'signup';

// A simple User type for demo purposes
interface User {
    email: string;
    pass: string; // In a real app, this would be a hash
}

const App: React.FC = () => {
    // Auth state
    const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('app_isAuthenticated', false);
    const [users, setUsers] = useLocalStorage<User[]>('app_users', []);
    const [authView, setAuthView] = useState<AuthView>('landing');

    // App Data State
    const [lists, setLists] = useLocalStorage<List[]>('lists', DEFAULT_LISTS);
    const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', DEFAULT_TASKS);
    const [habits, setHabits] = useLocalStorage<Habit[]>('habits', DEFAULT_HABITS);
    const [pomodoroSessions, setPomodoroSessions] = useLocalStorage<PomodoroSession[]>('pomodoroSessions', DEFAULT_POMODORO_SESSIONS);
    
    // UI State
    const [settings, setSettings] = useSettings();
    const [activeView, setActiveView] = useState<ActiveView>('tasks');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Auth handlers
    const handleSignup = useCallback((email: string, pass: string): boolean => {
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return false; // User already exists
        }
        setUsers(prev => [...prev, { email, pass }]);
        setIsAuthenticated(true);
        return true;
    }, [users, setUsers, setIsAuthenticated]);

    const handleLogin = useCallback((email: string, pass: string): boolean => {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.pass === pass);
        if (user) {
            setIsAuthenticated(true);
            return true;
        }
        return false;
    }, [users, setIsAuthenticated]);

    const handleLogout = useCallback(() => {
        setIsAuthenticated(false);
        setAuthView('landing');
    }, [setIsAuthenticated]);

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

        if (taskToToggle.recurrence && !taskToToggle.completed) {
            let nextDueDate: Date;

            if (taskToToggle.dueDate) {
                const [year, month, day] = taskToToggle.dueDate.split('-').map(Number);
                nextDueDate = new Date(Date.UTC(year, month - 1, day));
            } else {
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
                    subtasks: task.subtasks.map(st => ({...st, completed: false}))
                  } 
                : task
            ));
        } else {
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
    
    const handleUpdateSettings = useCallback((newSettings: Partial<Settings>) => {
        setSettings(prev => ({...prev, ...newSettings}));
    }, [setSettings]);


    if (!isAuthenticated) {
        switch (authView) {
            case 'login':
                return <LoginPage onLogin={handleLogin} onNavigate={setAuthView} />;
            case 'signup':
                return <SignupPage onSignup={handleSignup} onNavigate={setAuthView} />;
            case 'landing':
            default:
                return <LandingPage onNavigate={setAuthView} />;
        }
    }

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
                if (!settings.showHabitTracker) return <div className="p-6 text-content-primary"><h1 className="text-2xl font-bold">Habit Tracker Disabled</h1><p>Enable it in settings.</p></div>;
                return <HabitPage habits={habits} onToggleHabit={handleToggleHabit} onAddHabit={handleAddHabit} />;
            case 'pomodoro':
                 if (!settings.showPomodoro) return <div className="p-6 text-content-primary"><h1 className="text-2xl font-bold">Pomodoro Disabled</h1><p>Enable it in settings.</p></div>;
                return <PomodoroPage 
                    sessions={pomodoroSessions}
                    onAddSession={handleAddPomodoroSession}
                    tasks={tasks}
                    habits={habits}
                />;
            case 'analytics':
                return <AnalyticsPage
                    tasks={tasks}
                    habits={habits}
                    sessions={pomodoroSessions}
                    lists={lists}
                />;
            default:
                return <div className="p-6 text-content-primary"><h1 className="text-2xl font-bold">Not Found</h1></div>;
        }
    }

    return (
        <div className="flex h-screen font-sans text-content-primary bg-background-primary">
            <Sidebar 
                activeView={activeView}
                setActiveView={setActiveView}
                onOpenSettings={() => setIsSettingsOpen(true)}
                settings={settings}
            />
            <main className="flex-1 flex flex-col">
                {renderActiveView()}
            </main>
            <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onLogout={handleLogout}
                settings={settings}
                onSettingsChange={handleUpdateSettings}
            />
        </div>
    );
};

export default App;
