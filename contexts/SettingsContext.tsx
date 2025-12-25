import React, { createContext, useContext, useCallback } from 'react';
import { useSettings as useSettingsHook, Settings } from '../hooks/useSettings';

export type { Settings };

// Sound files hosted on reliable sources
const SOUND_FILES = {
    drip: 'https://www.soundjay.com/button/sounds/button-16.mp3',
    success: 'https://www.soundjay.com/button/sounds/button-09.mp3',
    default: 'https://www.soundjay.com/button/sounds/button-3.mp3',
    chime: 'https://www.soundjay.com/button/sounds/button-10.mp3',
    alert: 'https://www.soundjay.com/button/sounds/beep-07.mp3',
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
                
                // audio.play() returns a Promise which is rejected if playback fails.
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        // Browsers prevent autoplay until a user interacts with the page.
                        // We can safely ignore this specific error as it's expected behavior.
                        if (error.name !== 'NotAllowedError') {
                            console.error("Error playing sound:", error);
                        }
                    });
                }
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