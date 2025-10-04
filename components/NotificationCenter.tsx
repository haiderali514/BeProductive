import React, { useEffect, useRef } from 'react';
import { Notification } from '../types';
import { AIAssistantIcon, TasksIcon } from './Icons';

interface NotificationCenterProps {
    notifications: Notification[];
    onClose: () => void;
    onMarkAsRead: (id: string) => void;
    onClearAll: () => void;
}

const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};


export const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onClose, onMarkAsRead, onClearAll }) => {
    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const getIconForType = (type: Notification['type']) => {
        switch(type) {
            case 'task-due':
                return <TasksIcon />;
            case 'ai-suggestion':
                return <AIAssistantIcon />;
            default:
                return null;
        }
    };

    return (
        <div 
            ref={notificationRef} 
            className="absolute bottom-0 left-20 mb-2 w-80 max-h-[400px] bg-background-tertiary rounded-lg shadow-2xl border border-border-primary flex flex-col z-50"
        >
            <header className="p-3 flex justify-between items-center border-b border-border-primary flex-shrink-0">
                <h3 className="font-semibold text-content-primary">Notifications</h3>
                <button onClick={onClearAll} className="text-xs text-primary hover:underline">Clear All</button>
            </header>
            <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                    <p className="text-center text-sm text-content-secondary py-10">No new notifications.</p>
                ) : (
                    <ul className="divide-y divide-border-primary">
                        {notifications.map(n => (
                            <li 
                                key={n.id} 
                                className={`p-3 flex items-start space-x-3 transition-colors ${!n.read ? 'bg-primary/10' : 'hover:bg-background-secondary'}`}
                                onMouseEnter={() => !n.read && onMarkAsRead(n.id)}
                            >
                                <div className="flex-shrink-0 w-6 h-6 mt-1 text-content-secondary">
                                    {getIconForType(n.type)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-content-primary">{n.message}</p>
                                    <p className="text-xs text-content-tertiary mt-1">{formatTimeAgo(n.timestamp)}</p>
                                </div>
                                {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0"></div>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};