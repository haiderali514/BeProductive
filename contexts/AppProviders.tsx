
import React from 'react';
import { AuthProvider } from './AuthContext';
import { SettingsProvider } from './SettingsContext';
import { ApiUsageProvider } from './ApiUsageContext';
import { NotificationProvider } from './NotificationContext';
import { DataProvider } from './DataContext';
import { ChatProvider } from './ChatContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <AuthProvider>
            <SettingsProvider>
                <ApiUsageProvider>
                    <DataProvider>
                        <NotificationProvider>
                            <ChatProvider>
                                {children}
                            </ChatProvider>
                        </NotificationProvider>
                    </DataProvider>
                </ApiUsageProvider>
            </SettingsProvider>
        </AuthProvider>
    );
};
