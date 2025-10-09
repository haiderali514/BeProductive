
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

            <div className="bg-background-primary p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold text-content-primary flex items-center space-x-2">
                            <span>Enable AI Features</span>
                            <span className="text-xs bg-primary/20 text-primary font-bold px-2 py-0.5 rounded-full">BETA</span>
                        </h3>
                        <p className="text-xs text-content-secondary max-w-md">
                            Powers smart task parsing, subtask generation, AI assistant, and more.
                        </p>
                    </div>
                    <ToggleSwitch 
                        checked={settings.enableAIFeatures} 
                        onChange={(val) => onSettingsChange({ enableAIFeatures: val })} 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FeatureCard 
                    title="Calendar" 
                    description="Manage your task with six calendar views." 
                    imageUrl="https://picsum.photos/seed/calendar/400/200"
                    isEnabled={settings.showCalendar}
                    onToggle={(val) => onSettingsChange({ showCalendar: val })}
                />
                 <FeatureCard 
                    title="Eisenhower Matrix" 
                    description="Focus on what's important and urgent." 
                    imageUrl="https://picsum.photos/seed/matrix/400/200"
                    isEnabled={settings.showEisenhowerMatrix}
                    onToggle={(val) => onSettingsChange({ showEisenhowerMatrix: val })}
                />
                 <FeatureCard 
                    title="Habit Tracker" 
                    description="Develop a habit and keep track of it." 
                    imageUrl="https://picsum.photos/seed/habit/400/200"
                    isEnabled={settings.showHabitTracker}
                    onToggle={(val) => onSettingsChange({ showHabitTracker: val })}
                />
                 <FeatureCard 
                    title="Pomodoro" 
                    description="Use the Pomo timer or stopwatch to keep focus." 
                    imageUrl="https://picsum.photos/seed/pomodoro/400/200"
                    isEnabled={settings.showPomodoro}
                    onToggle={(val) => onSettingsChange({ showPomodoro: val })}
                />
                 <FeatureCard 
                    title="Countdown" 
                    description="Remember every special day." 
                    imageUrl="https://picsum.photos/seed/countdown/400/200"
                    isEnabled={settings.showCountdown}
                    onToggle={(val) => onSettingsChange({ showCountdown: val })}
                />
            </div>
        </div>
    );
};
