
import React from 'react';
import { Settings } from '../../hooks/useSettings';

interface FeaturesSettingsProps {
    settings: Settings;
    onSettingsChange: (newSettings: Partial<Settings>) => void;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; }> = ({ checked, onChange }) => (
    <button onClick={() => onChange(!checked)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${checked ? 'bg-primary' : 'bg-background-tertiary'}`}>
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);

const FeatureCard: React.FC<{ title: string; description: string; imageUrl: string; isEnabled: boolean; onToggle: (enabled: boolean) => void; }> = 
({ title, description, imageUrl, isEnabled, onToggle }) => (
    <div className="bg-background-primary p-4 rounded-lg flex flex-col">
        <div className="flex justify-between items-start mb-2">
            <div>
                <h3 className="font-semibold text-content-primary">{title}</h3>
                <p className="text-xs text-content-secondary max-w-[200px]">{description}</p>
            </div>
            <ToggleSwitch checked={isEnabled} onChange={onToggle} />
        </div>
        <div className="flex-grow w-full h-32 bg-background-tertiary rounded-md mt-2 overflow-hidden">
             <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
        <button className="text-xs text-primary mt-3 text-left hover:underline">{title.split(' ')[0]} Settings</button>
    </div>
);

export const FeaturesSettings: React.FC<FeaturesSettingsProps> = ({ settings, onSettingsChange }) => {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FeatureCard 
                    title="Calendar" 
                    description="Manage your task with six calendar views." 
                    imageUrl="https://i.imgur.com/8Q1Xz5Z.png"
                    isEnabled={settings.showCalendar}
                    onToggle={(val) => onSettingsChange({ showCalendar: val })}
                />
                 <FeatureCard 
                    title="Eisenhower Matrix" 
                    description="Focus on what's important and urgent." 
                    imageUrl="https://i.imgur.com/s6v4b3h.png"
                    isEnabled={settings.showEisenhowerMatrix}
                    onToggle={(val) => onSettingsChange({ showEisenhowerMatrix: val })}
                />
                 <FeatureCard 
                    title="Habit Tracker" 
                    description="Develop a habit and keep track of it." 
                    imageUrl="https://i.imgur.com/K3Z4r1L.png"
                    isEnabled={settings.showHabitTracker}
                    onToggle={(val) => onSettingsChange({ showHabitTracker: val })}
                />
                 <FeatureCard 
                    title="Pomodoro" 
                    description="Use the Pomo timer or stopwatch to keep focus." 
                    imageUrl="https://i.imgur.com/x0c2A8F.png"
                    isEnabled={settings.showPomodoro}
                    onToggle={(val) => onSettingsChange({ showPomodoro: val })}
                />
                 <FeatureCard 
                    title="Countdown" 
                    description="Remember every special day." 
                    imageUrl="https://i.imgur.com/lZJ9w1u.png"
                    isEnabled={settings.showCountdown}
                    onToggle={(val) => onSettingsChange({ showCountdown: val })}
                />
            </div>
        </div>
    );
};
