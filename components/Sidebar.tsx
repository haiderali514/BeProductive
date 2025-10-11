import React, { useState, useMemo, forwardRef, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { AnalyticsIcon, TasksIcon, HabitIcon, PomodoroIcon, SettingsIcon, AIAssistantIcon, NotificationBellIcon, MatrixIcon, CountdownIcon, UserIcon, CalendarIcon, TrophyIcon, MoreIcon } from './Icons';
import { ActiveView } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { useNotifications } from '../contexts/NotificationContext';
import { useData } from '../contexts/DataContext';
import { Popover } from './Popover';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onOpenSettings: () => void;
}

const SidebarIcon = forwardRef<HTMLButtonElement, {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  hasNotification?: boolean;
}>(({ icon, label, isActive, onClick, hasNotification }, ref) => (
    <button
        ref={ref}
        onClick={onClick}
        aria-label={label}
        className={`relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-200 group ${isActive ? 'bg-primary text-white' : 'text-content-secondary hover:bg-background-tertiary hover:text-content-primary'}`}
    >
        {icon}
        {hasNotification && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-background-secondary"></div>}
        <span className="absolute left-full ml-3 w-max px-2 py-1 bg-background-tertiary text-content-primary text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
            {label}
        </span>
    </button>
));


export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onOpenSettings }) => {
    const { settings } = useSettings();
    const { notifications, markNotificationAsRead, clearAllNotifications } = useNotifications();
    const { userProfile } = useData();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const moreMenuTriggerRef = useRef<HTMLButtonElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    const iconSize = "h-5 w-5";

    // FIX: Changed icon type to React.ReactElement for better type inference with React.cloneElement
    // @ts-ignore
    const viewIcons: Record<Exclude<ActiveView, 'profile'>, { icon: React.ReactElement<{ className?: string }>; label: string }> = {
        tasks: { icon: <TasksIcon className={iconSize} />, label: 'Tasks' },
        calendar: { icon: <CalendarIcon className={iconSize} />, label: 'Calendar' },
        'ai-assistant': { icon: <AIAssistantIcon className={iconSize} />, label: 'AI Assistant' },
        'eisenhower-matrix': { icon: <MatrixIcon className={iconSize} />, label: 'Eisenhower Matrix' },
        analytics: { icon: <AnalyticsIcon className={iconSize} />, label: 'Analytics' },
        achievements: { icon: <TrophyIcon className={iconSize} />, label: 'Achievements' },
        habits: { icon: <HabitIcon className={iconSize} />, label: 'Habits' },
        pomodoro: { icon: <PomodoroIcon className={iconSize} />, label: 'Pomodoro' },
        countdown: { icon: <CountdownIcon className={iconSize} />, label: 'Countdown' },
    };

    const { primaryViews, secondaryViews } = useMemo(() => {
        const order: Exclude<ActiveView, 'profile'>[] = ['ai-assistant', 'habits', 'tasks', 'pomodoro', 'calendar', 'eisenhower-matrix', 'analytics', 'achievements', 'countdown'];
        
        const visible = order.filter(view => {
            switch(view) {
                case 'calendar': return settings.showCalendar;
                case 'eisenhower-matrix': return settings.showEisenhowerMatrix;
                case 'habits': return settings.showHabitTracker;
                case 'pomodoro': return settings.showPomodoro;
                case 'countdown': return settings.showCountdown;
                case 'achievements': return true;
                default: return true;
            }
        });

        return {
            primaryViews: visible.slice(0, 6),
            secondaryViews: visible.slice(6),
        };
    }, [settings]);


    return (
        <aside className="w-16 bg-background-secondary flex flex-col items-center py-4 border-r border-border-primary">
            {/* Top section: Avatar */}
            <div className="group relative">
                <button 
                    onClick={() => setActiveView('profile')} 
                    aria-label="Open Profile"
                    className={`w-9 h-9 rounded-full transition-all ring-2 ring-offset-2 ring-offset-background-secondary ${activeView === 'profile' ? 'ring-primary' : 'ring-transparent'}`}
                >
                    <img src={userProfile.avatarUrl} alt={userProfile.name} className="w-full h-full rounded-full object-cover" />
                </button>
                <span className="absolute left-full ml-3 w-max px-2 py-1 bg-background-tertiary text-content-primary text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {userProfile.name}
                </span>
            </div>

            {/* Main navigation icons */}
            <nav className="flex flex-col items-center space-y-2 my-6">
                {primaryViews.map(view => (
                    <SidebarIcon
                        key={view}
                        icon={viewIcons[view].icon}
                        label={viewIcons[view].label}
                        isActive={activeView === view}
                        onClick={() => setActiveView(view)}
                    />
                ))}
                {secondaryViews.length > 0 && (
                    <>
                        <SidebarIcon
                            ref={moreMenuTriggerRef}
                            icon={<MoreIcon className={iconSize} />}
                            label="More"
                            isActive={isMoreMenuOpen}
                            onClick={() => setIsMoreMenuOpen(o => !o)}
                        />
                        <Popover isOpen={isMoreMenuOpen} onClose={() => setIsMoreMenuOpen(false)} triggerRef={moreMenuTriggerRef} position="right-start" className="ml-2">
                            <div className="w-48 bg-background-tertiary rounded-lg shadow-2xl border border-border-primary p-2">
                                {secondaryViews.map(view => (
                                    <button
                                    key={view}
                                    onClick={() => {
                                        setActiveView(view);
                                        setIsMoreMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center space-x-3 text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                        activeView === view
                                        ? 'bg-primary/20 text-primary font-semibold'
                                        : 'text-content-secondary hover:bg-background-primary'
                                    }`}
                                    >
                                        {React.cloneElement(viewIcons[view].icon, { className: iconSize })}
                                        <span>{viewIcons[view].label}</span>
                                    </button>
                                ))}
                            </div>
                        </Popover>
                    </>
                )}
            </nav>

            {/* Bottom section: Notifications & Settings */}
            <div className="mt-auto flex flex-col items-center space-y-2">
                <div className="relative">
                    <SidebarIcon
                        icon={<NotificationBellIcon className={iconSize} />}
                        label="Notifications"
                        isActive={isNotificationsOpen}
                        onClick={() => setIsNotificationsOpen(o => !o)}
                        hasNotification={unreadCount > 0}
                    />
                    {isNotificationsOpen && (
                        <NotificationCenter 
                            notifications={notifications}
                            onClose={() => setIsNotificationsOpen(false)}
                            onMarkAsRead={markNotificationAsRead}
                            onClearAll={clearAllNotifications}
                        />
                    )}
                </div>
                <SidebarIcon
                    icon={<SettingsIcon className={iconSize} />}
                    label="Settings"
                    isActive={false}
                    onClick={onOpenSettings}
                />
            </div>
        </aside>
    );
};
