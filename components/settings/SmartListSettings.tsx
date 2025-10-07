import React, { useState } from 'react';
import { Settings, SmartListVisibility } from '../../hooks/useSettings';
import { AllTasksIcon, TodayIcon, TomorrowIcon, Next7DaysIcon, AssignedToMeIcon, InboxIcon, SummaryIcon, TagIcon, FiltersIcon, CompletedIcon, WontDoIcon, TrashIcon } from '../Icons';

interface SmartListSettingsProps {
    settings: Settings;
    onSettingsChange: (newSettings: Partial<Settings>) => void;
}

// FIX: Added `as const` to infer `id` as a literal type.
const smartListsConfig = [
    { id: 'all', name: 'All', icon: <AllTasksIcon /> },
    { id: 'today', name: 'Today', icon: <TodayIcon /> },
    { id: 'tomorrow', name: 'Tomorrow', icon: <TomorrowIcon /> },
    { id: 'next7days', name: 'Next 7 Days', icon: <Next7DaysIcon /> },
    { id: 'assignedToMe', name: 'Assigned to Me', icon: <AssignedToMeIcon /> },
    { id: 'inbox', name: 'Inbox', icon: <InboxIcon /> },
    { id: 'summary', name: 'Summary', icon: <SummaryIcon /> },
] as const;

// FIX: Added `as const` to infer `id` as a literal type.
const otherListsConfig = [
    { id: 'tags', name: 'Tags', icon: <TagIcon /> },
    { id: 'filters', name: 'Filters', icon: <FiltersIcon /> },
    { id: 'completed', name: 'Completed', icon: <CompletedIcon /> },
    { id: 'wontdo', name: 'Won\'t Do', icon: <WontDoIcon /> },
    { id: 'trash', name: 'Trash', icon: <TrashIcon /> },
] as const;


const DropdownMenu: React.FC<{
    options: { value: SmartListVisibility, label: string }[];
    currentValue: SmartListVisibility;
    onSelect: (value: SmartListVisibility) => void;
}> = ({ options, currentValue, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const currentLabel = options.find(o => o.value === currentValue)?.label || 'Show';

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="text-sm text-content-secondary hover:text-content-primary">
                {currentLabel} &gt;
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-background-tertiary rounded-lg shadow-xl border border-border-primary z-20 p-2">
                    {options.map(opt => (
                        <button key={opt.value} onClick={() => { onSelect(opt.value); setIsOpen(false); }} className={`w-full text-left p-2 rounded text-sm hover:bg-background-primary ${currentValue === opt.value ? 'text-primary' : ''}`}>
                            {opt.label}
                             {currentValue === opt.value && <span className="float-right">✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
};


export const SmartListSettings: React.FC<SmartListSettingsProps> = ({ settings, onSettingsChange }) => {

    const handleSettingChange = (listId: keyof Settings['smartListSettings'], value: SmartListVisibility) => {
        onSettingsChange({
            smartListSettings: {
                ...settings.smartListSettings,
                [listId]: value,
            }
        });
    };
    
    const visibilityOptions: { value: SmartListVisibility, label: string }[] = [
        { value: 'show', label: 'Show' },
        { value: 'show-if-not-empty', label: 'Show if not empty' },
        { value: 'hide', label: 'Hide' },
    ];
    
    const simpleVisibilityOptions: { value: SmartListVisibility, label: string }[] = [
        { value: 'show', label: 'Show' },
        { value: 'hide', label: 'Hide' },
    ];


    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Smart List</h2>
            <div className="bg-background-primary rounded-lg divide-y divide-border-primary">
                {smartListsConfig.map(list => (
                    <div key={list.id} className="flex justify-between items-center p-4">
                        <div className="flex items-center space-x-3">
                            <span className="text-content-secondary">{list.icon}</span>
                            <span className="text-content-primary">{list.name}</span>
                        </div>
                        <DropdownMenu
                            options={visibilityOptions}
                            currentValue={settings.smartListSettings[list.id]}
                            onSelect={(value) => handleSettingChange(list.id, value)}
                        />
                    </div>
                ))}
            </div>

            <div className="bg-background-primary rounded-lg divide-y divide-border-primary mt-8">
                 {otherListsConfig.map(list => {
                    const key = list.id;
                    return (
                        <div key={list.id} className="flex justify-between items-center p-4">
                            <div className="flex items-center space-x-3">
                                <span className="text-content-secondary">{list.icon}</span>
                                <span className="text-content-primary">{list.name}</span>
                            </div>
                            <DropdownMenu
                                options={simpleVisibilityOptions}
                                currentValue={settings.smartListSettings[key]}
                                onSelect={(value) => handleSettingChange(key, value)}
                            />
                        </div>
                    );
                 })}
            </div>

        </div>
    );
};