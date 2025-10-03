
import React from 'react';

const ShortcutKey: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="px-2 py-1 bg-background-tertiary border border-border-primary rounded-md text-xs font-mono text-content-primary">
        {children}
    </div>
);

const ShortcutRow: React.FC<{ label: string; keys: string[] }> = ({ label, keys }) => (
    <div className="flex justify-between items-center py-3">
        <p className="text-content-primary">{label}</p>
        <div className="flex space-x-1">
            {keys.map(key => <ShortcutKey key={key}>{key}</ShortcutKey>)}
        </div>
    </div>
);


export const ShortcutsSettings: React.FC = () => {
    const generalShortcuts = [
        { label: 'Sync', keys: ['Ctrl', 'S'] },
        { label: 'Cancel', keys: ['Esc'] },
        { label: 'Undo', keys: ['Ctrl', 'Z'] },
        { label: 'Redo', keys: ['Ctrl', 'Shift', 'Z'] },
        { label: 'Print', keys: ['Ctrl', 'P'] },
        { label: 'Print Detail', keys: ['Set shortcut'] },
        { label: 'Open Command Menu', keys: ['Ctrl', 'K'] },
        { label: 'Shortcuts', keys: ['?'] },
    ];
    const globalActions = [
        { label: 'Quick Add', keys: ['Alt', 'Shift', 'A'] },
        { label: 'Show/Hide App', keys: ['Ctrl', 'Shift', 'E'] },
        { label: 'Open/Close focus window', keys: ['Ctrl', 'Shift', 'M'] },
    ];

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Shortcuts</h2>
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold mb-2">General</h3>
                    <div className="bg-background-primary rounded-lg divide-y divide-border-primary px-4">
                        {generalShortcuts.map(sc => <ShortcutRow key={sc.label} {...sc} />)}
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold mb-2">Global Action</h3>
                    <p className="text-sm text-content-secondary mb-3">Shortcuts that can respond even when the app is in the background.</p>
                    <div className="bg-background-primary rounded-lg divide-y divide-border-primary px-4">
                        {globalActions.map(sc => <ShortcutRow key={sc.label} {...sc} />)}
                    </div>
                </div>
            </div>
             <div className="mt-8 text-center">
                <button className="px-4 py-2 bg-background-tertiary text-content-primary rounded-lg font-semibold hover:bg-border-primary transition-colors">
                    Reset Default
                </button>
            </div>
        </div>
    );
};
