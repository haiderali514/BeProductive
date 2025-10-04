

import React, { useState, useCallback, useEffect } from 'react';
import { List, Task, Priority, Subtask, Habit, PomodoroSession, Recurrence, ActiveView, UserProfile, ChatMessage, UserTrait, Notification, Conversation, TraitType, GoalSubtype } from './types';
import { Sidebar } from './components/Sidebar';
import { TasksPage } from './components/TasksPage';
import { HabitPage } from './components/HabitPage';
import { PomodoroPage } from './components/PomodoroPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { ProfilePage } from './components/ProfilePage';
import { AIAssistantPage } from './components/AIAssistantPage';
import { generateSubtasks, chatWithAssistant, AIContext, getProactiveSuggestion, generateChatTitle } from './services/geminiService';
import useLocalStorage from './hooks/useLocalStorage';
import { DEFAULT_LISTS, DEFAULT_TASKS, DEFAULT_HABITS, DEFAULT_POMODORO_SESSIONS, DEFAULT_USER_PROFILE } from './constants';
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
    
    // UI State
    const [settings, setSettings] = useSettings();
    const initialViewOrder: ActiveView[] = ['tasks', 'ai-assistant', 'analytics', 'habits', 'pomodoro'];
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
                    const taskDueDateStr = new Date(task.dueDate + 'T00:00:00').toISOString().split('T')[0];
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

    const handleUpdateProfile = useCallback((newProfileData: Partial<UserProfile>) => {
        setUserProfile(prev => ({...prev, ...newProfileData}));
    }, [setUserProfile]);

    const getTasksForPeriod = (period: 'today' | 'tomorrow' | 'this week') => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filterFunc = (task: Task): boolean => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate + 'T00:00:00');
            if (isNaN(taskDate.getTime())) return false;
            if (task.completed) return false;

            switch (period) {
                case 'today':
                    return taskDate.getTime() === today.getTime();
                case 'tomorrow':
                    const tomorrow = new Date(today);
                    tomorrow.setDate(today.getDate() + 1);
                    return taskDate.getTime() === tomorrow.getTime();
                case 'this week':
                    const endOfWeek = new Date(today);
                    const dayOfWeek = today.getDay(); 
                    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; 
                    endOfWeek.setDate(today.getDate() - diff + 6);
                    endOfWeek.setHours(23, 59, 59, 999);
                    return taskDate >= today && taskDate <= endOfWeek;
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
    
    const appendMessageToConversation = (conversationId: string, message: ChatMessage) => {
        setConversations(prev => {
            const convoIndex = prev.findIndex(c => c.id === conversationId);
            if (convoIndex === -1) return prev;

            const updatedConvo = {
                ...prev[convoIndex],
                messages: [...prev[convoIndex].messages, message],
            };

            const newConversations = [...prev];
            newConversations[convoIndex] = updatedConvo;
            return newConversations;
        });
    };

    const handleSendMessageToAI = async (prompt: string) => {
        if (!activeConversationId) return;
    
        setIsAILoading(true);
        const newUserMessage: ChatMessage = { id: Date.now().toString(), role: 'user', parts: [{ text: prompt }] };
        
        const activeConvoBeforeUpdate = conversations.find(c => c.id === activeConversationId)!;
        const isNewChat = activeConvoBeforeUpdate.messages.filter(m => m.role === 'user').length === 0;

        appendMessageToConversation(activeConversationId, newUserMessage);
        
        const historyForAPI: Content[] = [...activeConvoBeforeUpdate.messages, newUserMessage].map(m => ({ role: m.role, parts: m.parts }));
    
        try {
            const context: AIContext = { tasks, lists, habits, profile: userProfile };
            const response = await chatWithAssistant(historyForAPI, context);
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
                        result = getTasksForPeriod(funcCall.args.period as 'today' | 'tomorrow' | 'this week');
                    } else if (funcCall.name === 'saveUserTrait') {
                        const newTrait: UserTrait = {
                            id: Date.now().toString(),
                            type: funcCall.args.traitType as TraitType,
                            text: funcCall.args.traitText as string,
                            subtype: (funcCall.args.goalSubtype as GoalSubtype) || undefined,
                        };
                        if (!userProfile.traits.some(t => t.text.toLowerCase() === newTrait.text.toLowerCase() && t.type === newTrait.type)) {
                            handleUpdateProfile({ traits: [...userProfile.traits, newTrait] });
                            result = { success: true, trait: newTrait };
                        } else {
                            result = { success: false, message: "Trait already exists." };
                        }
                    } else {
                        result = { error: `Function ${funcCall.name} not found.` };
                    }

                    functionResponses.push({
                        name: funcCall.name,
                        response: { result: result },
                    });
                }
                
                if (response.candidates?.[0]?.content) {
                    historyForAPI.push(response.candidates[0].content);
                }
                historyForAPI.push({ role: 'user', parts: [{ functionResponse: { name: 'tool_response', response: { responses: functionResponses }} }] });
                
                // We need to get the latest profile data for the context in case it was just updated.
                // A better approach would be to update context directly, but for now we re-read from state.
                const refreshedContext: AIContext = { ...context, profile: userProfile };

                const finalResponse = await chatWithAssistant(historyForAPI, refreshedContext);
                const responseText = finalResponse.text?.trim();
                const finalText = responseText || "I've processed that. What would you like to do next?";
                finalModelMessage = { id: Date.now().toString() + '-final', role: 'model', parts: [{ text: finalText }] };
            } else {
                const responseText = response.text?.trim();
                const finalText = responseText || "I'm not sure how to respond to that. Could you try rephrasing?";
                finalModelMessage = { id: Date.now().toString(), role: 'model', parts: [{ text: finalText }] };
            }

            appendMessageToConversation(activeConversationId, finalModelMessage);

            if (isNewChat) {
                const title = await generateChatTitle(prompt);
                setConversations(prev => prev.map(c =>
                    c.id === activeConversationId ? { ...c, title } : c
                ));
            }

        } catch (error) {
            console.error("AI Assistant Error:", error);
            const errorMessage: ChatMessage = { id: Date.now().toString(), role: 'model', parts: [{ text: "Sorry, I encountered an error. Please try again." }] };
            appendMessageToConversation(activeConversationId, errorMessage);
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
            case 'profile':
                return <ProfilePage
                    profile={userProfile}
                    onUpdateProfile={handleUpdateProfile}
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
                viewOrder={viewOrder}
                onViewOrderChange={setViewOrder}
                notifications={notifications}
                onMarkNotificationAsRead={handleMarkNotificationAsRead}
                onClearAllNotifications={handleClearAllNotifications}
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