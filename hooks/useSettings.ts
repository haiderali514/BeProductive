
import useLocalStorage from './useLocalStorage';

export interface Settings {
    // Features
    showCalendar: boolean;
    showEisenhowerMatrix: boolean;
    showHabitTracker: boolean;
    showPomodoro: boolean;
    showCountdown: boolean;
    
    // Notifications
    reminderType: 'in-app' | 'push';
    showNotificationDetails: 'always' | 'when-unlocked';
    ringtone: string;
    completionSound: string;
    reminderVolume: number;
    emailNotifications: boolean;

    // Date & Time
    timeFormat: '12h' | '24h';
    startWeekOn: 'saturday' | 'sunday' | 'monday';
    showWeekNumbers: boolean;

    // Appearance
    theme: string;
    autoSwitchTheme: boolean;
}

const defaultSettings: Settings = {
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
    theme: 'dark',
    autoSwitchTheme: false,
};

export const useSettings = () => {
    return useLocalStorage<Settings>('app_settings', defaultSettings);
};
