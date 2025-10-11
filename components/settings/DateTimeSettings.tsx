import React from 'react';
import { Settings } from '../../hooks/useSettings';

interface DateTimeSettingsProps {
    settings: Settings;
    onSettingsChange: (newSettings: Partial<Settings>) => void;
}

const SettingRow: React.FC<{ label: string, description?: string, children: React.ReactNode }> = ({ label, description, children }) => (
    <div className="flex justify-between items-center py-4">
        <div>
            <p className="text-content-primary">{label}</p>
            {description && <p className="text-sm text-content-tertiary">{description}</p>}
        </div>
        <div>{children}</div>
    </div>
);

const Dropdown: React.FC<{ value: string; options: {value: string, label: string}[]; onChange: (value: string) => void }> = ({ value, options, onChange }) => (
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

const timezones = [
    'UTC', 'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Tokyo',
    'Australia/Sydney', 'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
];


export const DateTimeSettings: React.FC<DateTimeSettingsProps> = ({ settings, onSettingsChange }) => {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-2">Date & Time</h2>
            <div className="bg-background-primary rounded-lg p-4 divide-y divide-border-primary">
                <SettingRow label="Time Format">
                    <Dropdown 
                        value={settings.timeFormat} 
                        onChange={(val) => onSettingsChange({ timeFormat: val as '12h' | '24h' })}
                        options={[
                            { value: '24h', label: '24 Hour (13:00)'}, 
                            { value: '12h', label: '12 Hour (1:00 PM)'}
                        ]} 
                    />
                </SettingRow>
                 <SettingRow label="Start Week On">
                    <Dropdown 
                        value={settings.startWeekOn} 
                        onChange={(val) => onSettingsChange({ startWeekOn: val as 'saturday' | 'sunday' | 'monday' })}
                        options={[
                            { value: 'saturday', label: 'Saturday'},
                            { value: 'sunday', label: 'Sunday'},
                            { value: 'monday', label: 'Monday'}
                        ]} 
                    />
                </SettingRow>
            </div>
             <div className="bg-background-primary rounded-lg p-4 mt-8 divide-y divide-border-primary">
                <SettingRow label="Additional Calendar">
                    <Dropdown
                        value={settings.additionalCalendar}
                        options={[{value: 'none', label: 'None'}, {value: 'hijri', label: 'Hijri (Civil)'}, {value: 'persian', label: 'Persian'}]}
                        onChange={(val) => onSettingsChange({ additionalCalendar: val as any })}
                    />
                </SettingRow>
                <SettingRow label="Show Week Numbers(W)">
                     <ToggleSwitch checked={settings.showWeekNumbers} onChange={(val) => onSettingsChange({ showWeekNumbers: val })} />
                </SettingRow>
            </div>
             <div className="bg-background-primary rounded-lg p-4 mt-8">
                 <SettingRow label="Time Zone" description="Dates and times will be adjusted to this time zone.">
                     <Dropdown 
                        value={settings.timezone}
                        options={timezones.map(tz => ({ value: tz, label: tz.replace(/_/g, ' ') }))}
                        onChange={(val) => onSettingsChange({ timezone: val })}
                    />
                </SettingRow>
            </div>
        </div>
    );
};