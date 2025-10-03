
import React, { useState } from 'react';
import { Settings } from '../../hooks/useSettings';
import { SettingsSidebar } from './SettingsSidebar';
import { AccountSettings } from './AccountSettings';
import { FeaturesSettings } from './FeaturesSettings';
import { NotificationsSettings } from './NotificationsSettings';
import { DateTimeSettings } from './DateTimeSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { ShortcutsSettings } from './ShortcutsSettings';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
    settings: Settings;
    onSettingsChange: (newSettings: Partial<Settings>) => void;
}

type SettingsPanel = 'account' | 'features' | 'notifications' | 'dateTime' | 'appearance' | 'shortcuts';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onLogout, settings, onSettingsChange }) => {
    const [activePanel, setActivePanel] = useState<SettingsPanel>('account');
    
    if (!isOpen) return null;

    const renderPanel = () => {
        switch(activePanel) {
            case 'account': return <AccountSettings onLogout={onLogout} />;
            case 'features': return <FeaturesSettings settings={settings} onSettingsChange={onSettingsChange} />;
            case 'notifications': return <NotificationsSettings settings={settings} onSettingsChange={onSettingsChange} />;
            case 'dateTime': return <DateTimeSettings settings={settings} onSettingsChange={onSettingsChange} />;
            case 'appearance': return <AppearanceSettings settings={settings} onSettingsChange={onSettingsChange} />;
            case 'shortcuts': return <ShortcutsSettings />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={onClose}>
            <div 
                className="bg-background-secondary w-full max-w-5xl h-[80vh] max-h-[700px] rounded-2xl shadow-2xl flex overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                <SettingsSidebar activePanel={activePanel} setActivePanel={setActivePanel} />
                <div className="flex-1 p-8 overflow-y-auto relative">
                     <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-content-tertiary hover:bg-background-tertiary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    {renderPanel()}
                </div>
            </div>
        </div>
    );
};
