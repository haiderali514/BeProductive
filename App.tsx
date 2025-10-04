import React, { useState, useCallback, useEffect } from 'react';
import { List, Task, Priority, Subtask, Habit, PomodoroSession, Recurrence, ActiveView, UserProfile, ChatMessage, UserTrait, Notification, Conversation, TraitType, GoalSubtype, Countdown } from './types';
import { Sidebar } from './components/Sidebar';
import { TasksPage } from './components/TasksPage';
import { HabitPage } from './components/HabitPage';
import { PomodoroPage } from './components/PomodoroPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { ProfilePage } from './components/ProfilePage';
import { AIAssistantPage } from './components/AIAssistantPage';
import { EisenhowerMatrixPage } from './components/EisenhowerMatrixPage';
import { CountdownPage } from './components/CountdownPage';
import { generateSubtasks, chatWithAssistant, AIContext, getProactiveSuggestion, generateChatTitle } from './services/geminiService';
import useLocalStorage from './hooks/useLocalStorage';
import { DEFAULT_LISTS, DEFAULT_TASKS, DEFAULT_HABITS, DEFAULT_POMODORO_SESSIONS, DEFAULT_USER_PROFILE, DEFAULT_COUNTDOWNS } from './constants';
import { LandingPage } from './components/auth/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { SettingsModal } from './components/settings/SettingsModal';
import { useSettings, Settings } from './hooks/useSettings';
import { Content } from '@google/genai';


type AuthView = 'landing' | 'login' | 'signup';

// A simple User type for demo purposes
interface User {
    email: string;
    pass: string; // In a real app, this would be a hash
}

const findFreeSlots = (dateStr: string, durationMinutes: number, sessions: PomodoroSession[]): string[] => {
    // 1. Define working hours for the target day
    const targetDate = new Date(dateStr + 'T00:00:00');
    if (isNaN(targetDate.getTime())) {
        console.error(`Invalid date string received from AI: ${dateStr}`);
        return ["I couldn't understand that date. Please use YYYY-MM-DD format, like '2024-08-10'."];
    }
    const workingHoursStart = new Date(targetDate.getTime());
    workingHoursStart.setHours(9, 0, 0, 0);
    const workingHoursEnd = new Date(targetDate.getTime());
    workingHoursEnd.setHours(18, 0, 0, 0);

    // 2. Get busy slots from pomodoro sessions for that day
    const busySlots = sessions
        .filter(s => new Date(s.startTime).toDateString() === targetDate.toDateString())
        .map(s => ({ start: s.startTime, end: s.endTime }))
        .sort((a, b) => a.start - b.start);

    // 3. Find gaps
    const freeSlots: { start: number, end: number }[] = [];
    let searchStart = workingHoursStart.getTime();

    // Add gaps between start of day and first busy slot, or whole day if no slots
    if (busySlots.length > 0) {
        if (busySlots[0].start > searchStart) {
            freeSlots.push({ start: searchStart, end: busySlots[0].start });
        }
    } else {
        freeSlots.push({ start: workingHoursStart.getTime(), end: workingHoursEnd.getTime() });
    }

    // Add gaps between busy slots
    for (let i = 0; i < busySlots.length - 1; i++) {
        const currentSlotEnd = busySlots[i].end;
        const nextSlotStart = busySlots[i + 1].start;
        if (nextSlotStart > currentSlotEnd) {
            freeSlots.push({ start: currentSlotEnd, end: nextSlotStart });
        }
    }
    
    // Add gap between last busy slot and end of day
    if (busySlots.length > 0) {
        const lastSlotEnd = busySlots[busySlots.length - 1].end;
        if (workingHoursEnd.getTime() > lastSlotEnd) {
            freeSlots.push({ start: lastSlotEnd, end: workingHoursEnd.getTime() });
        }
    }

    // 4. Filter gaps by the required duration
    const durationMs = durationMinutes * 60 * 1000;
    const validSlots = freeSlots.filter(slot => (slot.end - slot.start) >= durationMs);
    
    // 5. Format for the AI
    const to12Hour = (date: Date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    return validSlots.map(slot => {
        const start = new Date(slot.start);
        const end = new Date(slot.end);
        // We can just return the start time for simplicity, AI can offer that.
        // Example: "I found a slot at 10:00 AM" is easier than "10:00 AM - 11:30 AM"
        return to12Hour(start);
    });
};


const App: React.FC = () => {
    // Auth state
    const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('app_isAuthenticated', true);
    const [users, setUsers] = useLocalStorage<User[]>('app_users', []);
    const [authView, setAuthView] = useState<AuthView>('landing');

    // App Data State
    const [lists, setLists] = useLocalStorage<List[]>('lists', DEFAULT_LISTS);
    const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', DEFAULT_TASKS);
    const [habits, setHabits] = useLocalStorage<Habit[]>('habits', DEFAULT_HABITS);
    const [pomodoroSessions, setPomodoroSessions] = useLocalStorage<PomodoroSession[]>('pomodoroSessions', DEFAULT_POMODORO_SESSIONS);
    const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('userProfile', DEFAULT_USER_PROFILE);
    const [notifications, setNotifications] = useLocalStorage<Notification[]>('notifications', []);
    const [countdowns, setCountdowns] = useLocalStorage<Countdown[]>('countdowns', DEFAULT_COUNTDOWNS);
    
    // UI State
    const [settings, setSettings] = useSettings();
    const initialViewOrder: ActiveView[] = ['tasks', 'ai-assistant', 'eisenhower-matrix', 'analytics', 'habits', 'pomodoro', 'countdown'];
    const [viewOrder, setViewOrder] = useLocalStorage<ActiveView[]>('viewOrder', initialViewOrder);
    const [activeView, setActiveView] = useState<ActiveView>('tasks');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // AI Assistant State
    const [conversations, setConversations] = useLocalStorage<Conversation[]>('aiConversations', [
        { 
            id: '1', 
            title: 'Welcome Chat', 
            messages: [
                { id: '0', role: 'model', parts: [{ text: "Hello! I'm Aura, your personal AI assistant. How can I help you organize your day?" }]}
            ] 
        }
    ]);
    const [activeConversationId, setActiveConversationId] = useLocalStorage<string | null>('activeConversationId', '1');
    const [isAILoading, setIsAILoading] = useState(false);
    const [lastAISuggestion, setLastAISuggestion] = useLocalStorage<number>('lastAISuggestion', 0);

    // One-time data migration for user profile
    useEffect(() => {
        const profile = userProfile as any;
        if (profile && (profile.longTermGoals || profile.shortTermGoals || profile.struggles) && !profile.traits) {
            console.log("Migrating user profile to new 'traits' structure...");
            const newTraits: UserTrait[] = [];
            (profile.longTermGoals || []).forEach((g: any) => newTraits.push({ id: g.id, type: 'goal', subtype: 'long-term', text: g.text }));
            (profile.shortTermGoals || []).forEach((g: any) => newTraits.push({ id: g.id, type: 'goal', subtype: 'short-term', text: g.text }));
            (profile.struggles || []).forEach((s: any) => newTraits.push({ id: s.id, type: 'struggle', text: s.text }));

            const migratedProfile: UserProfile = {
                name: profile.name,
                email: profile.email,
                avatarUrl: profile.avatarUrl,
                traits: newTraits,
            };
            
            setUserProfile(migratedProfile);
        }
    }, []);

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

    const addNotification = useCallback((message: string, type: Notification['type'], relatedId?: string) => {
        if (type === 'task-due' && relatedId) {
            if (notifications.some(n => n.relatedId === relatedId && n.type === 'task-due')) {
                return;
            }
        }
        const newNotification: Notification = {
            id: Date.now().toString(),
            message,
            type,
            relatedId,
            read: false,
            timestamp: Date.now(),
        };
        setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep max 50 notifications
    }, [notifications, setNotifications]);
    
    // Effect for task reminders
    useEffect(() => {
        const checkTaskReminders = () => {
            const todayStr = new Date().toISOString().split('T')[0];
            
            tasks.forEach(task => {
                if (!task.completed && task.dueDate) {
                    const taskDueDateStr = task.dueDate.split(' ')[0];
                    if (taskDueDateStr <= todayStr) {
                        addNotification(`Task due: "${task.title}"`, 'task-due', task.id);
                    }
                }
            });
        };
    
        const intervalId = setInterval(checkTaskReminders, 60 * 1000); // Check every minute
        checkTaskReminders(); // check once on load
        return () => clearInterval(intervalId);
    }, [tasks, addNotification]);
    
    // Effect for proactive AI suggestions
    useEffect(() => {
        const fetchAISuggestion = async () => {
            const oneDay = 24 * 60 * 60 * 1000;
            if (Date.now() - lastAISuggestion < oneDay) {
                return; // Don't fetch if we got one recently
            }
    
            const context: AIContext = { tasks, lists, habits, profile: userProfile };
            const suggestion = await getProactiveSuggestion(context);
            
            if (suggestion) {
                addNotification(suggestion, 'ai-suggestion');
                setLastAISuggestion(Date.now());
            }
        };
        
        const timeoutId = setTimeout(fetchAISuggestion, 5000); // Fetch after a small delay
        return () => clearTimeout(timeoutId);
    
    }, [tasks, lists, habits, userProfile, addNotification, lastAISuggestion, setLastAISuggestion]);
    

    const handleMarkNotificationAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, [setNotifications]);

    const handleClearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, [setNotifications]);

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
        return newTask;
    }, [setTasks]);

    const handleToggleComplete = useCallback((taskId: string) => {
        const taskToToggle = tasks.find(task => task.id === taskId);
        if (!taskToToggle) return;

        if (taskToToggle.recurrence && !taskToToggle.completed) {
            let nextDueDate: Date;

            if (taskToToggle.dueDate) {
                // FIX: Handle dates with time components (e.g., "YYYY-MM-DD HH:MM") to prevent crash
                const datePart = taskToToggle.dueDate.split(' ')[0];
                const [year, month, day] = datePart.split('-').map(Number);
                
                // Add validation to prevent crash on malformed dates
                if (isNaN(year) || isNaN(month) || isNaN(day)) {
                     console.error(`Invalid date format for recurring task: ${taskToToggle.dueDate}. Completing without recurrence.`);
                     // Complete the task and remove recurrence to prevent future errors
                     setTasks(prevTasks => prevTasks.map(task => 
                        task.id === taskId ? { ...task, completed: true, recurrence: null } : task
                     ));
                     return;
                }

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

    const handleUpdateProfile = useCallback((newProfileData: Partial<UserProfile>) => {
        setUserProfile(prev => ({...prev, ...newProfileData}));
    }, [setUserProfile]);

    const getTasksForPeriod = (period: 'today' | 'tomorrow' | 'this week', startDay: Settings['startWeekOn']) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filterFunc = (task: Task): boolean => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate.replace(' ', 'T'));
            if (isNaN(taskDate.getTime())) return false;
            taskDate.setHours(0,0,0,0);
            if (task.completed) return false;

            switch (period) {
                case 'today':
                    return taskDate.getTime() === today.getTime();
                case 'tomorrow':
                    const tomorrow = new Date(today);
                    tomorrow.setDate(today.getDate() + 1);
                    return taskDate.getTime() === tomorrow.getTime();
                case 'this week': {
                    const dayOfWeek = today.getDay(); // Sunday = 0, Monday = 1, ...
                    
                    // Calculate the difference to the start of the week
                    let diff;
                    if (startDay === 'monday') {
                        diff = (dayOfWeek + 6) % 7; // 0 for Mon, 1 for Tue, ..., 6 for Sun
                    } else { // Sunday start
                        diff = dayOfWeek; // 0 for Sun, 1 for Mon, ...
                    }

                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - diff);
                    
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    endOfWeek.setHours(23, 59, 59, 999);

                    return taskDate >= startOfWeek && taskDate <= endOfWeek;
                }
                default:
                    return false;
            }
        };
        return tasks.filter(filterFunc);
    };

    const handleNewChat = () => {
        const newConversation: Conversation = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [
                { id: '0', role: 'model', parts: [{ text: "Hi there! What can I help you with?" }]}
            ]
        };
        setConversations(prev => [newConversation, ...prev]);
        setActiveConversationId(newConversation.id);
    };

    const handleDeleteConversation = (id: string) => {
        setConversations(prev => {
            const remaining = prev.filter(c => c.id !== id);
            if (activeConversationId === id) {
                setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
            }
            return remaining;
        });
    };
    
    const handleRenameConversation = (id: string, newTitle: string) => {
        setConversations(prev =>
            prev.map(c => (c.id === id ? { ...c, title: newTitle } : c))
        );
    };

    const handleAddCountdown = useCallback((title: string, date: string) => {
        const newCountdown: Countdown = {
            id: Date.now().toString(),
            title,
            date,
        };
        setCountdowns(prev => [newCountdown, ...prev].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    }, [setCountdowns]);

    const handleDeleteCountdown = useCallback((id: string) => {
        setCountdowns(prev => prev.filter(c => c.id !== id));
    }, [setCountdowns]);

    const handleSendMessageToAI = async (prompt: string) => {
        const conversationId = activeConversationId;
        if (!conversationId) return;
    
        setIsAILoading(true);
        
        const newUserMessage: ChatMessage = { id: Date.now().toString(), role: 'user', parts: [{ text: prompt }] };
        
        // Find the conversation and determine if it's a new chat
        const activeConvo = conversations.find(c => c.id === conversationId)!;
        const isNewChat = activeConvo.messages.filter(m => m.role === 'user').length === 0;
        
        // Prepare history for API *before* updating state
        const historyForAPI: Content[] = [...activeConvo.messages, newUserMessage].map(m => ({ role: m.role, parts: m.parts }));

        // First state update: Add the user's message
        setConversations(prev => prev.map(c => 
            c.id === conversationId ? { ...c, messages: [...c.messages, newUserMessage] } : c
        ));

        try {
            const context: AIContext = { tasks, lists, habits, profile: userProfile };
            let response = await chatWithAssistant(historyForAPI, context);
            let finalModelMessage: ChatMessage;
    
            if (response.functionCalls) {
                const functionResponses = [];
    
                for (const funcCall of response.functionCalls) {
                    let result: any;
                    if (funcCall.name === 'addTask') {
                        const list = lists.find(l => l.name.toLowerCase() === ((funcCall.args.listName as string) || 'inbox').toLowerCase()) || lists.find(l => l.id === 'inbox');
                        const newTask = handleAddTask({
                            title: funcCall.args.title as string,
                            listId: list!.id,
                            priority: (funcCall.args.priority as Priority) || Priority.NONE,
                            dueDate: (funcCall.args.dueDate as string) || null,
                            recurrence: null,
                        });
                        result = { success: true, task: newTask };
                    } else if (funcCall.name === 'getTasks') {
                        result = getTasksForPeriod(funcCall.args.period as 'today' | 'tomorrow' | 'this week', settings.startWeekOn);
                    } else if (funcCall.name === 'saveUserTrait') {
                        const newTrait: UserTrait = {
                            id: Date.now().toString(),
                            type: funcCall.args.traitType as TraitType,
                            text: funcCall.args.traitText as string,
                            subtype: (funcCall.args.goalSubtype as GoalSubtype) || undefined,
                        };
                        // Use a functional update to avoid stale state issues with userProfile
                        setUserProfile(currentProfile => {
                            if (!currentProfile.traits.some(t => t.text.toLowerCase() === newTrait.text.toLowerCase() && t.type === newTrait.type)) {
                                result = { success: true, trait: newTrait };
                                return { ...currentProfile, traits: [...currentProfile.traits, newTrait] };
                            } else {
                                result = { success: false, message: "Trait already exists." };
                                return currentProfile;
                            }
                        });
                    } else if (funcCall.name === 'getFreeSlots') {
                        result = findFreeSlots(
                            funcCall.args.date as string,
                            (funcCall.args.durationMinutes as number) || 60,
                            pomodoroSessions
                        );
                    } else {
                        result = { error: `Function ${funcCall.name} not found.` };
                    }

                    functionResponses.push({
                        name: funcCall.name,
                        response: { result: result },
                    });
                }
                
                const historyWithFunctionCall = [...historyForAPI];
                if (response.candidates?.[0]?.content) {
                    historyWithFunctionCall.push(response.candidates[0].content);
                }
                historyWithFunctionCall.push({ role: 'user', parts: [{ functionResponse: { name: 'tool_response', response: { responses: functionResponses }} }] });
                
                // The context might be stale if a trait was just added. Re-read from state before the second call.
                // This is a limitation; a better solution might involve passing state setters or using a state manager.
                // For now, we accept this potential micro-delay in context update for the second call.
                const refreshedContext: AIContext = { ...context, profile: userProfile };

                const finalResponse = await chatWithAssistant(historyWithFunctionCall, refreshedContext);
                const responseText = finalResponse.text?.trim();
                const finalText = responseText || "I've processed that. What would you like to do next?";
                finalModelMessage = { id: Date.now().toString() + '-final', role: 'model', parts: [{ text: finalText }] };
            } else {
                const responseText = response.text?.trim();
                const finalText = responseText || "I'm not sure how to respond to that. Could you try rephrasing?";
                finalModelMessage = { id: Date.now().toString(), role: 'model', parts: [{ text: finalText }] };
            }

            // Second state update: Add the model's message
            setConversations(prev => prev.map(c => 
                c.id === conversationId ? { ...c, messages: [...c.messages, finalModelMessage] } : c
            ));

            if (isNewChat) {
                const title = await generateChatTitle(prompt);
                // Third state update: Update title
                setConversations(prev => prev.map(c =>
                    c.id === conversationId ? { ...c, title } : c
                ));
            }

        } catch (error) {
            console.error("AI Assistant Error:", error);
            const errorMessage: ChatMessage = { id: Date.now().toString(), role: 'model', parts: [{ text: "Sorry, I encountered an error. Please try again." }] };
            // Error state update
            setConversations(prev => prev.map(c => 
                c.id === conversationId ? { ...c, messages: [...c.messages, errorMessage] } : c
            ));
        } finally {
            setIsAILoading(false);
        }
    };


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
                return <HabitPage habits={habits} onToggleHabit={handleToggleHabit} onAddHabit={handleAddHabit} settings={settings} />;
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
                    profile={userProfile}
                />;
            case 'profile':
                return <ProfilePage
                    profile={userProfile}
                    onUpdateProfile={handleUpdateProfile}
                    tasks={tasks}
                />;
            case 'ai-assistant':
                 return <AIAssistantPage 
                    conversations={conversations}
                    activeConversationId={activeConversationId}
                    isLoading={isAILoading}
                    onSendMessage={handleSendMessageToAI}
                    onNewChat={handleNewChat}
                    onSelectConversation={setActiveConversationId}
                    onDeleteConversation={handleDeleteConversation}
                    onRenameConversation={handleRenameConversation}
                 />;
            case 'eisenhower-matrix':
                if (!settings.showEisenhowerMatrix) return <div className="p-6 text-content-primary"><h1 className="text-2xl font-bold">Eisenhower Matrix Disabled</h1><p>Enable it in settings.</p></div>;
                return <EisenhowerMatrixPage tasks={tasks} />;
            case 'countdown':
                if (!settings.showCountdown) return <div className="p-6 text-content-primary"><h1 className="text-2xl font-bold">Countdown Disabled</h1><p>Enable it in settings.</p></div>;
                return <CountdownPage countdowns={countdowns} onAddCountdown={handleAddCountdown} onDeleteCountdown={handleDeleteCountdown} />;
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
                viewOrder={viewOrder}
                onViewOrderChange={setViewOrder}
                notifications={notifications}
                onMarkNotificationAsRead={handleMarkNotificationAsRead}
                onClearAllNotifications={handleClearAllNotifications}
                userProfile={userProfile}
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