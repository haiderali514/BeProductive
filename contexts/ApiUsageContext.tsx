


import React, { createContext, useContext } from 'react';
import { useApiUsage as useApiUsageHook, ApiUsage, ApiFeature } from '../hooks/useApiUsage';

type ApiUsageContextType = [ApiUsage, (feature: ApiFeature, tokens: number) => void];

const ApiUsageContext = createContext<ApiUsageContextType | undefined>(undefined);

export const ApiUsageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [usage, logApiCall] = useApiUsageHook();
    return (
        <ApiUsageContext.Provider value={[usage, logApiCall]}>
            {children}
        </ApiUsageContext.Provider>
    );
};

export const useApiUsage = (): ApiUsageContextType => {
    const context = useContext(ApiUsageContext);
    if (context === undefined) {
        throw new Error('useApiUsage must be used within an ApiUsageProvider');
    }
    return context;
};

// FIX: Export ApiFeature to make it available to other modules.
export type { ApiFeature };