import React, { createContext, useContext, useCallback, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { Notification } from '../types';
import { useData } from './DataContext';
import { useSettings } from './SettingsContext';
import { useApiUsage } from './ApiUsageContext';
import { getProactiveSuggestion } from '../services/geminiService';

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (message: string, type: Notification['type'], relatedId?: string) => void;
    markNotificationAsRead: (id: string) => void;
    clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { tasks, lists, habits, userProfile, pomodoroSessions } = useData();
    const { settings, playSound } = useSettings();
    const [, logApiCall] = useApiUsage();

    const [notifications, setNotifications] = useLocalStorage<Notification[]>('notifications', []);
    const [lastAISuggestion, setLastAISuggestion] = useLocalStorage<number>('lastAISuggestion', 0);

    const addNotification = useCallback((message: string, type: Notification['type'], relatedId?: string) => {
        if (type === 'task-due' && relatedId && notifications.some(n => n.relatedId === relatedId && n.type === 'task-due')) {
            return;
        }
        
        // Always add to in-app center
        const newNotification: Notification = { id: Date.now().toString(), message, type, relatedId, read: false, timestamp: Date.now() };
        setNotifications(prev => [newNotification, ...prev].slice(0, 50));

        const isReminder = type === 'task-due' || type === 'habit-reminder';

        // Handle delivery type
        if (isReminder) {
            if (settings.reminderType === 'push' && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                // eslint-disable-next-line no-new
                new Notification("AI Task Manager", {
                    body: message,
                    icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                });
            }
            playSound('reminder');
        }
    }, [notifications, setNotifications, settings.reminderType, playSound]);

    const markNotificationAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, [setNotifications]);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, [setNotifications]);

    // Effect for Task Reminders
    useEffect(() => {
        const checkTaskReminders = () => {
            const now = new Date();
            const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

            tasks.forEach(task => {
                if (!task.completed && task.dueDate) {
                    const dueDate = new Date(task.dueDate.replace(' ', 'T'));
                    if (dueDate > now && dueDate <= oneHourFromNow) {
                        addNotification(`Task "${task.title}" is due soon.`, 'task-due', task.id);
                    }
                }
            });
        };

        const intervalId = setInterval(checkTaskReminders, 15 * 60 * 1000); // Check every 15 minutes
        return () => clearInterval(intervalId);
    }, [tasks, addNotification]);

    // Effect for Habit Reminders
    useEffect(() => {
        const checkHabitReminders = () => {
            const now = new Date();
            const currentHour = now.getHours();
            
            let period: 'Morning' | 'Afternoon' | 'Night' | null = null;
            if (currentHour === 9) period = 'Morning'; // 9 AM
            else if (currentHour === 15) period = 'Afternoon'; // 3 PM
            else if (currentHour === 21) period = 'Night'; // 9 PM

            if (period) {
                const todayStr = now.toISOString().split('T')[0];
                habits.forEach(habit => {
                    if (habit.period === period && !habit.checkIns.includes(todayStr)) {
                        const alreadyNotified = notifications.some(n => 
                            n.relatedId === habit.id && 
                            n.type === 'habit-reminder' && 
                            new Date(n.timestamp).toISOString().split('T')[0] === todayStr
                        );
                        if (!alreadyNotified) {
                            addNotification(`Don't forget your ${period.toLowerCase()} habit: "${habit.name}"`, 'habit-reminder', habit.id);
                        }
                    }
                });
            }
        };
        
        checkHabitReminders();
        const intervalId = setInterval(checkHabitReminders, 60 * 60 * 1000); // Check every hour
        return () => clearInterval(intervalId);
    }, [habits, addNotification, notifications]);

    // Effect for Proactive AI Suggestions
    useEffect(() => {
        const checkProactiveSuggestion = async () => {
            if (!settings.enableAIFeatures) return;

            const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;
            if (Date.now() - lastAISuggestion < SIX_HOURS_IN_MS) {
                return;
            }
            
            setLastAISuggestion(Date.now());

            try {
                const context = { tasks, lists, habits, profile: userProfile, pomodoroSessions };
                const { data: suggestion, tokensUsed } = await getProactiveSuggestion(context);
                logApiCall('proactiveSuggestions', tokensUsed);

                if (suggestion) {
                    addNotification(suggestion, 'ai-suggestion');
                }
            } catch (error) {
                console.error("Failed to get proactive suggestion:", error);
            }
        };
        
        checkProactiveSuggestion();
        const intervalId = setInterval(checkProactiveSuggestion, 60 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, [tasks, lists, habits, userProfile, pomodoroSessions, addNotification, lastAISuggestion, setLastAISuggestion, settings.enableAIFeatures, logApiCall]);


    const value = { notifications, addNotification, markNotificationAsRead, clearAllNotifications };

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};