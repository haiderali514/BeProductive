import useLocalStorage from './useLocalStorage';

export type SmartListVisibility = 'show' | 'show-if-not-empty' | 'hide';

export interface Settings {
    // AI Features
    enableAIFeatures: boolean;
    
    // Features
    showCalendar: boolean;
    showEisenhowerMatrix: boolean;
    showHabitTracker: boolean;
    showPomodoro: boolean;
    showCountdown: boolean;
    
    // Notifications
    reminderType: 'in-app' | 'push';
    showNotificationDetails: 'always' | 'when-unlocked' | 'never';
    ringtone: string;
    completionSound: string;
    reminderVolume: number;
    emailNotifications: boolean;

    // Date & Time
    timeFormat: '12h' | '24h';
    startWeekOn: 'saturday' | 'sunday' | 'monday';
    showWeekNumbers: boolean;
    additionalCalendar: 'none' | 'hijri' | 'persian';
    timezone: string;

    // Appearance
    theme: string;
    autoSwitchTheme: boolean;
    font: 'default' | 'roboto' | 'arial' | 'inter' | 'poppins' | 'nunito';
    fontSize: 'normal' | 'large' | 'extra-large';
    sidebarCount: 'show' | 'hover' | 'hide';
    completedTaskStyle: 'default' | 'strikethrough';
    taskInputStyle: 'simple' | 'detailed';

    // Smart Lists & Sidebar Sections
    smartListOrder: string[];
    smartListSettings: {
        all: SmartListVisibility;
        today: SmartListVisibility;
        tomorrow: SmartListVisibility;
        next7days: SmartListVisibility;
        assignedToMe: SmartListVisibility;
        inbox: SmartListVisibility;
        summary: SmartListVisibility;
        filters: SmartListVisibility;
        tags: SmartListVisibility;
        completed: SmartListVisibility;
        trash: SmartListVisibility;
        wontdo: SmartListVisibility;
    };
}

const defaultSettings: Settings = {
    enableAIFeatures: false,
    showCalendar: true,
    showEisenhowerMatrix: true,
    showHabitTracker: true,
    showPomodoro: true,
    showCountdown: false,
    reminderType: 'in-app',
    showNotificationDetails: 'when-unlocked',
    ringtone: 'default',
    completionSound: 'drip',
    reminderVolume: 80,
    emailNotifications: false,
    timeFormat: '24h',
    startWeekOn: 'monday',
    showWeekNumbers: true,
    additionalCalendar: 'none',
    timezone: 'Asia/Karachi',
    theme: 'dark',
    autoSwitchTheme: false,
    font: 'default',
    fontSize: 'normal',
    sidebarCount: 'show',
    completedTaskStyle: 'default',
    taskInputStyle: 'simple',
    smartListOrder: ['inbox', 'summary', 'all', 'today', 'tomorrow', 'next7days', 'assignedToMe'],
    smartListSettings: {
        all: 'show',
        today: 'show',
        tomorrow: 'show-if-not-empty',
        next7days: 'show',
        assignedToMe: 'hide',
        inbox: 'show',
        summary: 'hide',
        filters: 'show',
        tags: 'show',
        completed: 'show',
        trash: 'show',
        wontdo: 'show',
    },
};

export const useSettings = () => {
    return useLocalStorage<Settings>('app_settings', defaultSettings);
};