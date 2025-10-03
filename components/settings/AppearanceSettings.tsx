
import React from 'react';
import { Settings } from '../../hooks/useSettings';
import { PremiumIcon } from '../Icons';

interface AppearanceSettingsProps {
    settings: Settings;
    onSettingsChange: (newSettings: Partial<Settings>) => void;
}

const colors = [
    { name: 'Default', bg: '#FFFFFF', isDark: false },
    { name: 'Sky', bg: '#3B82F6', isDark: false },
    { name: 'Turquoise', bg: '#14B8A6', isDark: false },
    { name: 'Teal', bg: '#2DD4BF', isDark: false },
    { name: 'Matcha', bg: '#A3E635', isDark: false },
    { name: 'Sunshine', bg: '#FBBF24', isDark: false },
    { name: 'Peach', bg: '#F472B6', isDark: false },
    { name: 'Lilac', bg: '#A78BFA', isDark: false },
    { name: 'Ebony', bg: '#D1BFA4', isDark: true },
    { name: 'Navy', bg: '#374151', isDark: true },
    { name: 'Gray', bg: '#6B7280', isDark: true },
    { name: 'Dark', bg: '#1E1E1E', isDark: true },
];

const themes = [
    { name: 'Spring', img: 'https://i.imgur.com/eBf2P5V.png', premium: true },
    { name: 'Summer', img: 'https://i.imgur.com/h5TzG6N.png', premium: true },
    { name: 'Autumn', img: 'https://i.imgur.com/FwB3Y6L.png', premium: true },
    { name: 'Winter', img: 'https://i.imgur.com/gKj3t9Q.png', premium: true },
];

const cityThemes = [
    { name: 'London', img: 'https://i.imgur.com/iJj4z7K.png', premium: true },
    { name: 'Moscow', img: 'https://i.imgur.com/r7wY2gJ.png', premium: true },
    { name: 'San Francisco', img: 'https://i.imgur.com/b9D1U8H.png', premium: true },
    { name: 'Seoul', img: 'https://i.imgur.com/z2x4M5E.png', premium: true },
];

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; }> = ({ checked, onChange }) => (
    <button onClick={() => onChange(!checked)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${checked ? 'bg-primary' : 'bg-background-tertiary'}`}>
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);


export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ settings, onSettingsChange }) => {
    return (
        <div>
             <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold">Appearance</h2>
                 <div className="flex space-x-1 bg-background-primary p-1 rounded-lg">
                    <button className="px-4 py-1.5 text-sm font-semibold bg-background-tertiary rounded-md">Theme</button>
                    <button className="px-4 py-1.5 text-sm font-semibold text-content-secondary hover:bg-background-tertiary rounded-md">App Icons</button>
                    <button className="px-4 py-1.5 text-sm font-semibold text-content-secondary hover:bg-background-tertiary rounded-md">Display</button>
                 </div>
             </div>
             
             <div className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-3">Color Series</h3>
                    <div className="grid grid-cols-6 gap-4">
                        {colors.map(color => (
                            <div key={color.name} className="flex flex-col items-center space-y-2">
                                <button className="w-12 h-12 rounded-full ring-2 ring-offset-2 ring-offset-background-primary" style={{ backgroundColor: color.bg, borderColor: settings.theme === color.name.toLowerCase() ? '#4A90E2' : 'transparent'}}>
                                    {settings.theme === color.name.toLowerCase() && <div className="flex items-center justify-center w-full h-full"><svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${color.isDark ? 'text-white' : 'text-black'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>}
                                </button>
                                <p className="text-xs text-content-secondary">{color.name}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold mb-3">Season Series</h3>
                     <div className="grid grid-cols-4 gap-4">
                        {themes.map(theme => (
                            <div key={theme.name} className="relative">
                                <img src={theme.img} alt={theme.name} className="rounded-lg aspect-video object-cover"/>
                                {theme.premium && <div className="absolute top-2 right-2 bg-yellow-500 text-black p-1 rounded-full"><PremiumIcon className="w-3 h-3"/></div>}
                                 <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/30 rounded-b-lg"><p className="text-white text-sm text-center">{theme.name}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold mb-3">City Series</h3>
                     <div className="grid grid-cols-4 gap-4">
                        {cityThemes.map(theme => (
                            <div key={theme.name} className="relative">
                                <img src={theme.img} alt={theme.name} className="rounded-lg aspect-video object-cover"/>
                                {theme.premium && <div className="absolute top-2 right-2 bg-yellow-500 text-black p-1 rounded-full"><PremiumIcon className="w-3 h-3"/></div>}
                                 <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/30 rounded-b-lg"><p className="text-white text-sm text-center">{theme.name}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-border-primary">
                    <p>Auto switch theme according to system.</p>
                    <ToggleSwitch checked={settings.autoSwitchTheme} onChange={(val) => onSettingsChange({ autoSwitchTheme: val })} />
                </div>

             </div>
        </div>
    );
};
