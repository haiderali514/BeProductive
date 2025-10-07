import useLocalStorage from './useLocalStorage';
import { useEffect, useCallback } from 'react';

export interface ApiUsageBreakdown {
  smartAddTask: { count: number; tokens: number };
  generateSubtasks: { count: number; tokens: number };
  aiAssistant: { count: number; tokens: number };
  planWithAI: { count: number; tokens: number };
  weeklyReview: { count: number; tokens: number };
  goalProgress: { count: number; tokens: number };
  proactiveSuggestions: { count: number; tokens: number };
  chatTitleGeneration: { count: number; tokens: number };
}

export type ApiFeature = keyof ApiUsageBreakdown;

// FIX: Defined and exported the ApiUsage interface to make it available for import in other modules.
export interface ApiUsage {
  totalTokens: number;
  resetsOn: string;
  breakdown: ApiUsageBreakdown;
}

export const FEATURE_NAMES: Record<ApiFeature, string> = {
    smartAddTask: 'Smart Task Add',
    generateSubtasks: 'Subtask Generation',
    aiAssistant: 'AI Assistant Chat',
    planWithAI: 'Plan with AI',
    weeklyReview: 'Weekly Review',
    goalProgress: 'Goal Progress Reports',
    proactiveSuggestions: 'Proactive Suggestions',
    chatTitleGeneration: 'Chat Title Generation',
};

const getNextResetDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
};

const defaultApiUsage: ApiUsage = {
  totalTokens: 0,
  resetsOn: getNextResetDate(),
  breakdown: {
    smartAddTask: { count: 0, tokens: 0 },
    generateSubtasks: { count: 0, tokens: 0 },
    aiAssistant: { count: 0, tokens: 0 },
    planWithAI: { count: 0, tokens: 0 },
    weeklyReview: { count: 0, tokens: 0 },
    goalProgress: { count: 0, tokens: 0 },
    proactiveSuggestions: { count: 0, tokens: 0 },
    chatTitleGeneration: { count: 0, tokens: 0 },
  },
};

export const useApiUsage = (): [ApiUsage, (feature: ApiFeature, tokens: number) => void] => {
    const [usage, setUsage] = useLocalStorage<ApiUsage>('api_usage', defaultApiUsage);

    useEffect(() => {
        // Check for reset on hook initialization as well
        if (new Date() > new Date(usage.resetsOn)) {
            setUsage({ ...defaultApiUsage, resetsOn: getNextResetDate() });
        }
    }, [usage.resetsOn, setUsage]);

    const logApiCall = useCallback((feature: ApiFeature, tokens: number) => {
        setUsage(prevUsage => {
            // Check if reset date has passed
            if (new Date() > new Date(prevUsage.resetsOn)) {
                const newDefault = { ...defaultApiUsage, resetsOn: getNextResetDate() };
                newDefault.totalTokens = tokens;
                newDefault.breakdown[feature].count = 1;
                newDefault.breakdown[feature].tokens = tokens;
                return newDefault;
            }

            const newBreakdown = { ...prevUsage.breakdown };
            newBreakdown[feature] = {
                count: (newBreakdown[feature]?.count || 0) + 1,
                tokens: (newBreakdown[feature]?.tokens || 0) + tokens,
            };

            return {
                ...prevUsage,
                totalTokens: (prevUsage.totalTokens || 0) + tokens,
                breakdown: newBreakdown,
            };
        });
    }, [setUsage]);
    
    return [usage, logApiCall];
};