
import React from 'react';
import { AccountIcon, TrophyIcon, FeaturesIcon, SmartListIcon, NotificationsIcon, DateTimeIcon, AppearanceIcon, MoreIcon, IntegrationsIcon, CollaborateIcon, StickyNoteIcon, DesktopWidgetsIcon, ShortcutsIcon, AboutIcon } from '../Icons';

type SettingsPanel = 'account' | 'features' | 'smartList' | 'notifications' | 'dateTime' | 'appearance' | 'shortcuts';

interface SettingsSidebarProps {
    activePanel: SettingsPanel;
    setActivePanel: (panel: SettingsPanel) => void;
}

const SidebarItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm rounded-lg transition-colors duration-200 ${
            isActive ? 'bg-primary/20 text-primary font-semibold' : 'text-content-secondary hover:bg-background-tertiary'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activePanel, setActivePanel }) => {
    const panels = [
        { id: 'account', label: 'Account', icon: <AccountIcon /> },
        { id: 'premium', label: 'Premium', icon: <TrophyIcon />, disabled: true },
        { id: 'features', label: 'Features', icon: <FeaturesIcon /> },
        { id: 'smartList', label: 'Smart List', icon: <SmartListIcon /> },
        { id: 'notifications', label: 'Notifications', icon: <NotificationsIcon /> },
        { id: 'dateTime', label: 'Date & Time', icon: <DateTimeIcon /> },
        { id: 'appearance', label: 'Appearance', icon: <AppearanceIcon /> },
        { id: 'more', label: 'More', icon: <MoreIcon />, disabled: true },
    ];
     const otherPanels = [
        { id: 'integrations', label: 'Integrations & Import', icon: <IntegrationsIcon />, disabled: true },
        { id: 'collaborate', label: 'Collaborate', icon: <CollaborateIcon />, disabled: true },
        { id: 'stickyNote', label: 'Sticky Note', icon: <StickyNoteIcon />, disabled: true },
        { id: 'desktopWidgets', label: 'Desktop Widgets', icon: <DesktopWidgetsIcon />, disabled: true },
        { id: 'shortcuts', label: 'Shortcuts', icon: <ShortcutsIcon /> },
        { id: 'about', label: 'About', icon: <AboutIcon />, disabled: true },
    ];

    return (
        <aside className="w-64 bg-background-primary p-4 border-r border-border-primary flex flex-col">
            <h2 className="text-xl font-bold px-4 mb-4">Settings</h2>
            <nav className="space-y-1">
                {panels.map(p => (
                    <SidebarItem key={p.id} label={p.label} icon={p.icon} isActive={activePanel === p.id} onClick={() => !p.disabled && setActivePanel(p.id as SettingsPanel)} />
                ))}
            </nav>
            <div className="my-4 border-t border-border-primary"></div>
            <nav className="space-y-1">
                 {otherPanels.map(p => (
                    <SidebarItem key={p.id} label={p.label} icon={p.icon} isActive={activePanel === p.id} onClick={() => !p.disabled && setActivePanel(p.id as SettingsPanel)} />
                ))}
            </nav>
        </aside>
    );
};