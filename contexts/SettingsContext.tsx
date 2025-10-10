import React, { createContext, useContext, useCallback } from 'react';
import { useSettings as useSettingsHook, Settings } from '../hooks/useSettings';

export type { Settings };

// Sound files hosted on a reliable CDN
const SOUND_FILES = {
    drip: 'https://cdn.pixabay.com/audio/2022/03/22/audio_ad46179a66.mp3',
    success: 'https://cdn.pixabay.com/audio/2022/03/15/audio_a46a3c63aa.mp3',
    default: 'https://cdn.pixabay.com/audio/2021/08/04/audio_bb63214a16.mp3',
    chime: 'https://cdn.pixabay.com/audio/2022/05/23/audio_73b94b3c88.mp3',
    alert: 'https://cdn.pixabay.com/audio/2022/10/14/audio_924250a252.mp3',
};

export type SoundType = 'completion' | 'reminder';

// Updated Context Type to an object for better extensibility
interface SettingsContextType {
    settings: Settings;
    onSettingsChange: (newSettings: Partial<Settings>) => void;
    playSound: (type: SoundType) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useSettingsHook();
    
    const onSettingsChange = (newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const playSound = useCallback((type: SoundType) => {
        const { completionSound, ringtone, reminderVolume } = settings;
        
        let soundKey: string | null = null;
        if (type === 'completion') {
            if (completionSound !== 'none') {
                soundKey = completionSound;
            }
        } else if (type === 'reminder') {
            soundKey = ringtone;
        }

        if (soundKey && SOUND_FILES[soundKey as keyof typeof SOUND_FILES]) {
            try {
                const audio = new Audio(SOUND_FILES[soundKey as keyof typeof SOUND_FILES]);
                audio.volume = reminderVolume / 100;
                audio.play().catch(e => console.error("Error playing sound:", e));
            } catch (error) {
                console.error("Could not play sound:", error);
            }
        }
    }, [settings]);

    const value = { settings, onSettingsChange, playSound };

    return (
        <SettingsContext.Provider value={value}>
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
