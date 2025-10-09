


import React, { createContext, useContext } from 'react';
import { useSettings as useSettingsHook, Settings } from '../hooks/useSettings';

// FIX: Export the Settings type so it can be imported from this module.
export type { Settings };

type SettingsContextType = [Settings, (newSettings: Partial<Settings>) => void];

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useSettingsHook();
    
    const handleSettingsChange = (newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    return (
        <SettingsContext.Provider value={[settings, handleSettingsChange]}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};