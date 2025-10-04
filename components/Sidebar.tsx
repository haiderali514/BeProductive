
import React, { useRef, useState } from 'react';
import { Settings } from '../hooks/useSettings';
import { AnalyticsIcon, UserIcon, TasksIcon, HabitIcon, PomodoroIcon, SettingsIcon, AIAssistantIcon, NotificationBellIcon } from './Icons';
import { ActiveView, Notification } from '../types';
import { NotificationCenter } from './NotificationCenter';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onOpenSettings: () => void;
  settings: Settings;
  viewOrder: ActiveView[];
  onViewOrderChange: (newOrder: ActiveView[]) => void;
  notifications: Notification[];
  onMarkNotificationAsRead: (id: string) => void;
  onClearAllNotifications: () => void;
}

const SidebarIcon: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, isActive, onClick, children }) => (
  <div className="relative group flex justify-center">
    <button
      onClick={onClick}
      aria-label={label}
      className={`h-12 w-12 flex items-center justify-center rounded-lg transition-all duration-200 ${
        isActive ? 'bg-primary text-white' : 'text-content-secondary hover:bg-background-tertiary hover:text-primary'
      }`}
    >
      {children}
    </button>
    <span className="absolute left-16 p-2 px-3 text-sm text-primary-content bg-background-tertiary rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
      {label}
    </span>
  </div>
);

export const Sidebar: React.FC<SidebarProps> = (props) => {
    const { 
        activeView, setActiveView, onOpenSettings, settings, 
        viewOrder, onViewOrderChange, notifications,
        onMarkNotificationAsRead, onClearAllNotifications
    } = props;

    const draggedViewRef = useRef<ActiveView | null>(null);
    const [draggingView, setDraggingView] = useState<ActiveView | null>(null);
    const dragHappened = useRef(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleDragStart = (e: React.DragEvent, view: ActiveView) => {
        dragHappened.current = false;
        draggedViewRef.current = view;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', view);
        setTimeout(() => {
            setDraggingView(view);
        }, 0);
    };

    const handleDragEnter = (e: React.DragEvent, targetView: ActiveView) => {
        e.preventDefault();
        dragHappened.current = true;
        const draggedView = draggedViewRef.current;
        if (!draggedView || targetView === draggedView) {
            return;
        }

        const fromIndex = viewOrder.indexOf(draggedView);
        const toIndex = viewOrder.indexOf(targetView);

        if (fromIndex !== -1 && toIndex !== -1) {
            const newOrder = [...viewOrder];
            const [movedItem] = newOrder.splice(fromIndex, 1);
            newOrder.splice(toIndex, 0, movedItem);
            onViewOrderChange(newOrder);
        }
    };
    
    const handleDragEnd = () => {
        draggedViewRef.current = null;
        setDraggingView(null);
        setTimeout(() => {
            dragHappened.current = false;
        }, 0);
    };
    
    const handleIconClick = (view: ActiveView) => {
        if (dragHappened.current) {
            return;
        }
        setActiveView(view);
        setIsNotificationsOpen(false);
    };
    
    const handleProfileClick = () => {
        setActiveView('profile');
        setIsNotificationsOpen(false);
    };

    const toggleNotifications = () => {
        setIsNotificationsOpen(prev => !prev);
    };

    const iconConfig: Record<ActiveView, { label: string; icon: React.ReactNode; isVisible: boolean }> = {
        tasks: { label: 'Tasks', icon: <TasksIcon />, isVisible: true },
        'ai-assistant': { label: 'AI Assistant', icon: <AIAssistantIcon />, isVisible: true },
        analytics: { label: 'Analytics', icon: <AnalyticsIcon />, isVisible: true },
        habits: { label: 'Habits', icon: <HabitIcon />, isVisible: settings.showHabitTracker },
        pomodoro: { label: 'Pomodoro', icon: <PomodoroIcon />, isVisible: settings.showPomodoro },
        profile: { label: 'Profile', icon: <UserIcon />, isVisible: true } // Added for type completeness, but not used in draggable list
    };
    
    const visibleViews = viewOrder.filter(view => iconConfig[view] && iconConfig[view].isVisible);
  
    return (
        <aside className="w-20 bg-background-secondary flex flex-col items-center py-4 space-y-4 border-r border-border-primary">
          <div className="w-10 h-10 bg-primary rounded-full mb-4"></div>
          
          <div className="flex flex-col items-center flex-grow w-full">
            <SidebarIcon label="Profile" isActive={activeView === 'profile'} onClick={handleProfileClick}>
              <UserIcon />
            </SidebarIcon>
            <div className="w-10/12 border-t border-border-primary my-2"></div>
            
            <div className="w-full space-y-2">
                {visibleViews.map(view => {
                    const config = iconConfig[view];
                    if (!config) return null;
                    const isDragging = draggingView === view;
                    return (
                        <div
                            key={view}
                            draggable
                            onDragStart={(e) => handleDragStart(e, view)}
                            onDragEnter={(e) => handleDragEnter(e, view)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            className={`w-full cursor-grab transition-all duration-300 ease-in-out ${isDragging ? 'opacity-30 scale-110' : 'opacity-100'}`}
                        >
                            <SidebarIcon label={config.label} isActive={activeView === view} onClick={() => handleIconClick(view)}>
                                {config.icon}
                            </SidebarIcon>
                        </div>
                    );
                })}
            </div>

            <div 
                className="flex-grow w-full"
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => {
                    e.preventDefault();
                    dragHappened.current = true;
                    const draggedView = draggedViewRef.current;
                    if (!draggedView) return;

                    const lastItemInOrder = viewOrder[viewOrder.length - 1];
                    if (draggedView !== lastItemInOrder) {
                        const fromIndex = viewOrder.indexOf(draggedView);
                        if (fromIndex === -1) return;
                        
                        const newOrder = [...viewOrder];
                        const [item] = newOrder.splice(fromIndex, 1);
                        newOrder.push(item);
                        
                        onViewOrderChange(newOrder);
                    }
                }}
            />
          </div>
    
          <div className="flex flex-col space-y-2 items-center">
             <div className="relative">
                <SidebarIcon label="Notifications" isActive={isNotificationsOpen} onClick={toggleNotifications}>
                    <NotificationBellIcon />
                     {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background-secondary"></span>
                    )}
                </SidebarIcon>
                {isNotificationsOpen && (
                    <NotificationCenter
                        notifications={notifications}
                        onClose={() => setIsNotificationsOpen(false)}
                        onMarkAsRead={onMarkNotificationAsRead}
                        onClearAll={onClearAllNotifications}
                    />
                )}
            </div>

            <SidebarIcon label="Settings" isActive={false} onClick={onOpenSettings}>
                <SettingsIcon />
            </SidebarIcon>
          </div>
        </aside>
    );
};