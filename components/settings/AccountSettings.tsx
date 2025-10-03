
import React from 'react';

interface AccountSettingsProps {
    onLogout: () => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ onLogout }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mb-4 overflow-hidden">
                <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User Avatar" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-bold text-content-primary">Ch Haider Ali</h2>
            <p className="text-content-secondary mb-8">chhaiderali0509@gmail.com</p>
            
            <div className="space-y-3 flex flex-col items-center">
                 <button className="w-48 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-focus transition-colors">
                    Modify Account
                </button>
                 <button className="w-48 px-4 py-2 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-600 transition-colors">
                    Upgrade Now
                </button>
                 <button 
                    onClick={onLogout}
                    className="w-48 px-4 py-2 bg-background-tertiary text-content-primary rounded-lg font-semibold hover:bg-border-primary transition-colors"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};
