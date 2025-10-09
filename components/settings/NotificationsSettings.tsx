

import React from 'react';
import { Settings } from '../../hooks/useSettings';

interface NotificationsSettingsProps {
    settings: Settings;
    onSettingsChange: (newSettings: Partial<Settings>) => void;
}

const SettingRow: React.FC<{ label: string, description?: string, children: React.ReactNode }> = ({ label, description, children }) => (
    <div className="flex justify-between items-center py-4 border-b border-border-primary">
        <div>
            <p className="text-content-primary">{label}</p>
            {description && <p className="text-sm text-content-tertiary">{description}</p>}
        </div>
        <div>{children}</div>
    </div>
);

const Dropdown: React.FC<{
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}> = ({ value, options, onChange }) => (
     <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-background-tertiary border border-border-primary rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
    >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
);

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; }> = ({ checked, onChange }) => (
    <button onClick={() => onChange(!checked)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${checked ? 'bg-primary' : 'bg-background-tertiary'}`}>
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);


export const NotificationsSettings: React.FC<NotificationsSettingsProps> = ({ settings, onSettingsChange }) => {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-2">Notifications</h2>
            <div className="bg-background-primary rounded-lg p-4 divide-y divide-border-primary">
                <SettingRow label="Reminder">
                    <Dropdown
                        value={settings.reminderType}
                        onChange={(val) => onSettingsChange({ reminderType: val as any })}
                        options={[
                            { value: 'in-app', label: 'In-app reminder' },
                            { value: 'push', label: 'Push notification' }
                        ]}
                    />
                </SettingRow>
                <SettingRow label="Show Notification Details" description="Display notification title and content on screen when receiving a notification.">
                    <Dropdown
                        value={settings.showNotificationDetails}
                        onChange={(val) => onSettingsChange({ showNotificationDetails: val as any })}
                        options={[
                            { value: 'when-unlocked', label: 'When unlocked' },
                            { value: 'always', label: 'Always' },
                            { value: 'never', label: 'Never' }
                        ]}
                    />
                </SettingRow>
                <SettingRow label="Ringtone">
                    <Dropdown
                        value={settings.ringtone}
                        onChange={(val) => onSettingsChange({ ringtone: val })}
                        options={[
                            { value: 'default', label: 'Default' },
                            { value: 'chime', label: 'Chime' },
                            { value: 'alert', label: 'Alert' }
                        ]}
                    />
                </SettingRow>
                <SettingRow label="Completion Sound">
                     <Dropdown
                        value={settings.completionSound}
                        onChange={(val) => onSettingsChange({ completionSound: val })}
                        options={[
                            { value: 'drip', label: 'Drip' },
                            { value: 'success', label: 'Success' },
                            { value: 'none', label: 'None' }
                        ]}
                     />
                </SettingRow>
                 <SettingRow label="Reminder Volume">
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={settings.reminderVolume}
                        onChange={(e) => onSettingsChange({ reminderVolume: parseInt(e.target.value) })}
                        className="w-32"
                    />
                </SettingRow>
            </div>

            <div className="bg-background-primary rounded-lg p-4 mt-8">
                 <SettingRow label="Email Notifications" description="If enabled, you can receive task notifications in Emails. The daily limit of reminders is 50.">
                     <ToggleSwitch checked={settings.emailNotifications} onChange={(val) => onSettingsChange({ emailNotifications: val })} />
                </SettingRow>
                <p className="text-sm text-content-secondary mt-2 pl-4">chhaiderali0509@gmail.com</p>
            </div>
        </div>
    );
};