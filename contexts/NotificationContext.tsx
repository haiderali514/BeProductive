

import React, { createContext, useContext, useCallback, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Notification } from '../types';
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
    const { tasks, lists, habits, userProfile } = useData();
    const [settings] = useSettings();
    const [, logApiCall] = useApiUsage();

    const [notifications, setNotifications] = useLocalStorage<Notification[]>('notifications', []);
    const [lastAISuggestion, setLastAISuggestion] = useLocalStorage<number>('lastAISuggestion', 0);

    const addNotification = useCallback((message: string, type: Notification['type'], relatedId?: string) => {
        if (type === 'task-due' && relatedId && notifications.some(n => n.relatedId === relatedId && n.type === 'task-due')) {
            return;
        }
        const newNotification: Notification = { id: Date.now().toString(), message, type, relatedId, read: false, timestamp: Date.now() };
        setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    }, [notifications, setNotifications]);

    const markNotificationAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, [setNotifications]);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, [setNotifications]);

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

    useEffect(() => {
        const checkProactiveSuggestion = async () => {
            if (!settings.enableAIFeatures) return;

            // Only check once every 6 hours
            const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;
            if (Date.now() - lastAISuggestion < SIX_HOURS_IN_MS) {
                return;
            }
            
            console.log("Checking for proactive AI suggestion...");
            setLastAISuggestion(Date.now());

            try {
                const context = { tasks, lists, habits, profile: userProfile };
                const { data: suggestion, tokensUsed } = await getProactiveSuggestion(context);
                logApiCall('proactiveSuggestions', tokensUsed);

                if (suggestion) {
                    addNotification(suggestion, 'ai-suggestion');
                }
            } catch (error) {
                console.error("Failed to get proactive suggestion:", error);
            }
        };
        
        // Check on initial load and then every hour
        checkProactiveSuggestion();
        const intervalId = setInterval(checkProactiveSuggestion, 60 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, [tasks, lists, habits, userProfile, addNotification, lastAISuggestion, setLastAISuggestion, settings.enableAIFeatures, logApiCall]);


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