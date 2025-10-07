



import React, { useState } from 'react';
import { Settings } from '../../hooks/useSettings.ts';
import { PremiumIcon } from '../Icons.tsx';

interface AppearanceSettingsProps {
    settings: Settings;
    onSettingsChange: (newSettings: Partial<Settings>) => void;
}

// Sub-components to build the UI
const CheckmarkCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const PremiumBadge: React.FC = () => (
    <div className="absolute top-0 left-0 bg-yellow-400 w-4 h-4" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' } as React.CSSProperties}>
        <div className="absolute top-0 left-0 transform -rotate-45 -translate-x-1/2 -translate-y-1/2">
             {/* FIX: Cast style object to React.CSSProperties to allow for custom CSS properties like '--tw-text-opacity'. */}
             <span className="text-yellow-400 text-xs font-bold" style={{'--tw-text-opacity': 0} as React.CSSProperties}>★</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-black absolute" style={{top: '1px', left: '1px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
    </div>
);


const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button onClick={onClick} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-background-tertiary' : 'text-content-secondary hover:bg-background-tertiary'}`}>
        {label}
    </button>
);

const Section: React.FC<{ title: string; children: React.ReactNode; cols?: number }> = ({ title, children, cols = 3 }) => (
    <div>
        <h3 className="font-semibold mb-3 text-content-primary">{title}</h3>
        <div className={`grid grid-cols-${cols} gap-4`}>
            {children}
        </div>
    </div>
);

interface OptionCardProps {
    label: string;
    isSelected: boolean;
    onClick: () => void;
    children: React.ReactNode;
    isPremium?: boolean;
}

const OptionCard: React.FC<OptionCardProps> = ({ label, isSelected, onClick, children, isPremium }) => (
    <div onClick={onClick} className="relative cursor-pointer">
        <div className={`relative bg-background-primary border rounded-lg p-2 min-h-24 flex items-center justify-center overflow-hidden ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-border-primary'}`}>
            {children}
            {isPremium && <PremiumBadge />}
        </div>
        <p className="text-center text-sm text-content-secondary mt-2">{label}</p>
        {isSelected && (
            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full">
                <CheckmarkCircleIcon />
            </div>
        )}
    </div>
);

// Main Component
export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ settings, onSettingsChange }) => {
    const [activeTab, setActiveTab] = useState<'theme' | 'app-icons' | 'display'>('display');

    // Data for the settings options
    const fontOptions = [
        { id: 'default', name: 'Default', premium: false },
        { id: 'roboto', name: 'Roboto', premium: false },
        { id: 'arial', name: 'Arial', premium: false },
        { id: 'inter', name: 'Inter', premium: true },
        { id: 'poppins', name: 'Poppins', premium: true },
        { id: 'nunito', name: 'Nunito', premium: true },
    ];

    const fontSizeOptions = [
        { id: 'normal', name: 'Normal' },
        { id: 'large', name: 'Large' },
        { id: 'extra-large', name: 'Extra-Large' },
    ];

    const sidebarCountOptions = [
        { id: 'show', name: 'Show' },
        { id: 'hover', name: 'Show on Hover' },
        { id: 'hide', name: 'Hide' },
    ];

    const completedTaskOptions = [
        { id: 'default', name: 'Default' },
        { id: 'strikethrough', name: 'Strikethrough' },
    ];
    
    // Preview components for cards
    const SidebarPreview: React.FC<{ type: typeof settings.sidebarCount }> = ({ type }) => (
        <div className="w-3/4 h-3/4 bg-background-secondary p-2 rounded flex flex-col items-start space-y-1 text-xs">
            <div className="flex w-full justify-between items-center">
                <span className="text-content-secondary">Today</span>
                {(type === 'show' || type === 'hover') && 
                    <span className={`text-content-tertiary ${type === 'hover' ? 'opacity-50' : ''}`}>3</span>}
            </div>
            <div className="flex w-full justify-between items-center">
                <span className="text-content-secondary">Inbox</span>
                {(type === 'show' || type === 'hover') && 
                    <span className={`text-content-tertiary ${type === 'hover' ? 'opacity-50' : ''}`}>16</span>}
            </div>
        </div>
    );

    const CompletedTaskPreview: React.FC<{ type: typeof settings.completedTaskStyle }> = ({ type }) => (
        <div className="w-3/4 bg-background-secondary p-2 rounded text-xs">
             <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0 mr-2"></div>
                <span className={`text-content-secondary ${type === 'strikethrough' ? 'line-through' : ''}`}>Task Title</span>
             </div>
        </div>
    );

    const renderDisplaySettings = () => (
        <div className="space-y-8">
            <Section title="Font">
                {fontOptions.map(font => (
                    <OptionCard 
                        key={font.id}
                        label={font.name} 
                        isSelected={settings.font === font.id}
                        onClick={() => onSettingsChange({ font: font.id as any })}
                        isPremium={font.premium}
                    >
                        <span className="text-2xl" style={{ fontFamily: font.name.toLowerCase() !== 'default' ? font.name : 'inherit' }}>{font.name}</span>
                    </OptionCard>
                ))}
            </Section>

            <Section title="Font Size">
                {fontSizeOptions.map(size => (
                    <OptionCard
                        key={size.id}
                        label={size.name}
                        isSelected={settings.fontSize === size.id}
                        onClick={() => onSettingsChange({ fontSize: size.id as any })}
                    >
                        <span className={`font-semibold ${size.id === 'normal' ? 'text-base' : size.id === 'large' ? 'text-lg' : 'text-xl'}`}>
                            Font Size
                        </span>
                    </OptionCard>
                ))}
            </Section>

            <Section title="Sidebar Count">
                {sidebarCountOptions.map(option => (
                    <OptionCard
                        key={option.id}
                        label={option.name}
                        isSelected={settings.sidebarCount === option.id}
                        onClick={() => onSettingsChange({ sidebarCount: option.id as any })}
                    >
                       <SidebarPreview type={option.id as any} />
                    </OptionCard>
                ))}
            </section>
            
            <Section title="Completed Task Style" cols={2}>
                 {completedTaskOptions.map(option => (
                    <OptionCard
                        key={option.id}
                        label={option.name}
                        isSelected={settings.completedTaskStyle === option.id}
                        onClick={() => onSettingsChange({ completedTaskStyle: option.id as any })}
                    >
                        <CompletedTaskPreview type={option.id as any}/>
                    </OptionCard>
                ))}
            </Section>
        </div>
    );
    
    const colors = [ { name: 'Default', bg: '#FFFFFF', isDark: false }, { name: 'Sky', bg: '#3B82F6', isDark: false }, { name: 'Turquoise', bg: '#14B8A6', isDark: false }, { name: 'Teal', bg: '#2DD4BF', isDark: false }, { name: 'Matcha', bg: '#A3E635', isDark: false }, { name: 'Sunshine', bg: '#FBBF24', isDark: false }, { name: 'Peach', bg: '#F472B6', isDark: false }, { name: 'Lilac', bg: '#A78BFA', isDark: false }, { name: 'Ebony', bg: '#D1BFA4', isDark: true }, { name: 'Navy', bg: '#374151', isDark: true }, { name: 'Gray', bg: '#6B7280', isDark: true }, { name: 'Dark', bg: '#1E1E1E', isDark: true }, ];
    const themes = [ { name: 'Spring', img: 'https://picsum.photos/seed/spring/400/200', premium: true }, { name: 'Summer', img: 'https://picsum.photos/seed/summer/400/200', premium: true }, { name: 'Autumn', img: 'https://picsum.photos/seed/autumn/400/200', premium: true }, { name: 'Winter', img: 'https://picsum.photos/seed/winter/400/200', premium: true }, ];
    const cityThemes = [ { name: 'London', img: 'https://picsum.photos/seed/london/400/200', premium: true }, { name: 'Moscow', img: 'https://picsum.photos/seed/moscow/400/200', premium: true }, { name: 'San Francisco', img: 'https://picsum.photos/seed/sanfrancisco/400/200', premium: true }, { name: 'Seoul', img: 'https://picsum.photos/seed/seoul/400/200', premium: true }, ];
    const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; }> = ({ checked, onChange }) => ( <button onClick={() => onChange(!checked)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${checked ? 'bg-primary' : 'bg-background-tertiary'}`}> <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} /> </button> );

    const renderThemeSettings = () => (
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
    );


    return (
        <div>
             <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold">Appearance</h2>
                 <div className="flex space-x-1 bg-background-primary p-1 rounded-lg">
                    <TabButton label="Theme" isActive={activeTab === 'theme'} onClick={() => setActiveTab('theme')} />
                    <TabButton label="App icons" isActive={activeTab === 'app-icons'} onClick={() => setActiveTab('app-icons')} />
                    <TabButton label="Display" isActive={activeTab === 'display'} onClick={() => setActiveTab('display')} />
                 </div>
             </div>
             
            {activeTab === 'display' && renderDisplaySettings()}
            {activeTab === 'theme' && renderThemeSettings()}
            {activeTab === 'app-icons' && <p className="text-center text-content-secondary py-10">App icon settings are not available in this version.</p>}

        </div>
    );
};