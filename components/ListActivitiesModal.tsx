import React from 'react';
import { Activity, List } from '../types';
import { CloseIcon, PlusIcon, CheckItemIcon, TrashIcon, EditIcon, MoveToListIcon, ArchiveIcon } from './Icons';

const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);

    if (seconds < 2) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

const ActivityIcon: React.FC<{ type: Activity['type'] }> = ({ type }) => {
    const iconClass = "w-4 h-4 text-content-secondary";
    switch(type) {
        case 'task_added': return <PlusIcon />;
        case 'task_completed': return <CheckItemIcon />;
        case 'task_uncompleted': return <CheckItemIcon />;
        case 'task_deleted': return <TrashIcon />;
        case 'task_restored': return <ArchiveIcon />;
        case 'task_title_updated': return <EditIcon />;
        case 'task_list_moved': return <MoveToListIcon />;
        case 'list_created': return <PlusIcon />;
        case 'list_renamed': return <EditIcon />;
        default: return null;
    }
};

const ActivityDescription: React.FC<{ activity: Activity }> = ({ activity }) => {
    const { type, details } = activity;
    const taskTitle = <strong className="font-semibold text-content-primary">{details.taskTitle}</strong>;
    const from = <strong className="font-semibold text-content-primary">{details.from}</strong>;
    const to = <strong className="font-semibold text-content-primary">{details.to}</strong>;

    switch (type) {
        case 'task_added':
            return <>You added task {taskTitle}</>;
        case 'task_completed':
            return <>You completed task {taskTitle}</>;
        case 'task_uncompleted':
            return <>You marked task {taskTitle} as incomplete</>;
        case 'task_deleted':
            return <>You moved task {taskTitle} to Trash</>;
        case 'task_restored':
            return <>You restored task {taskTitle} from Trash</>;
        case 'task_title_updated':
            return <>You renamed {from} to {to}</>;
        case 'task_list_moved':
            if (details.to) {
                return <>You moved task {taskTitle} to {to}</>;
            }
            if (details.from) {
                return <>You moved task {taskTitle} from {from}</>;
            }
            return <>You moved task {taskTitle}</>;
        case 'list_renamed':
             return <>You renamed this list from {from} to {to}</>;
        case 'list_created':
             return <>You created this list</>;
        default:
            return <>An unknown action was performed.</>;
    }
};

interface ListActivitiesModalProps {
    isOpen: boolean;
    onClose: () => void;
    listId: string;
    listName: string;
    activities: Activity[];
}

export const ListActivitiesModal: React.FC<ListActivitiesModalProps> = ({ isOpen, onClose, listId, listName, activities }) => {
    if (!isOpen) return null;

    const listActivities = activities.filter(a => a.listId === listId);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background-secondary rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[70vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border-primary flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-content-primary">Activities for "{listName}"</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-content-tertiary hover:bg-background-tertiary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    {listActivities.length > 0 ? (
                        <ul className="space-y-4">
                            {listActivities.map(activity => (
                                <li key={activity.id} className="flex items-start space-x-3">
                                    <div className="mt-1 flex-shrink-0"><ActivityIcon type={activity.type} /></div>
                                    <div className="flex-1 text-sm text-content-secondary">
                                        <p><ActivityDescription activity={activity} /></p>
                                        <p className="text-xs text-content-tertiary mt-0.5">{formatTimeAgo(activity.timestamp)}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-10 text-content-tertiary">
                            <p>No activities recorded for this list yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};