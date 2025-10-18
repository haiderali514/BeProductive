


import React from 'react';
// @google/genai-sdk: Fix: Imported FEATURE_NAMES to ensure all ApiFeatures are included.
import { ApiUsage, ApiFeature, FEATURE_NAMES } from '../../hooks/useApiUsage';

interface AccountSettingsProps {
    onLogout: () => void;
    apiUsage: ApiUsage;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ onLogout, apiUsage }) => {
    const FREE_TIER_LIMIT = 1000000;
    const usagePercentage = Math.min((apiUsage.totalTokens / FREE_TIER_LIMIT) * 100, 100);
    const resetDate = new Date(apiUsage.resetsOn).toLocaleDateString(undefined, {
        month: 'long', day: 'numeric', year: 'numeric'
    });

    const formatFeatureName = (key: string) => {
        return FEATURE_NAMES[key as ApiFeature] || key;
    };

    const sortedBreakdown = (Object.entries(apiUsage.breakdown) as [string, { count: number; tokens: number }][])
        .filter(([, value]) => value.count > 0)
        .sort(([, a], [, b]) => b.tokens - a.tokens);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Account</h2>
            <div className="flex flex-col items-center justify-center">
                 <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mb-4 overflow-hidden">
                    <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User Avatar" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-2xl font-bold text-content-primary">Ch Haider Ali</h2>
                <p className="text-content-secondary">chhaiderali0509@gmail.com</p>
            </div>
            
            <div className="w-full bg-background-primary p-6 rounded-lg my-8">
                <h3 className="text-lg font-semibold text-content-primary mb-3">API Usage</h3>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-content-secondary">Free Tier Tokens</span>
                        <span>
                            <span className="font-bold text-content-primary">{apiUsage.totalTokens.toLocaleString()}</span>
                            <span className="text-content-tertiary"> / {FREE_TIER_LIMIT.toLocaleString()}</span>
                        </span>
                    </div>
                    <div className="w-full bg-background-tertiary rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${usagePercentage}%` }}></div>
                    </div>
                    <p className="text-xs text-content-tertiary text-right">Resets on {resetDate}</p>
                </div>
                
                <h4 className="font-semibold text-content-primary mt-6 mb-2">Usage by Feature</h4>
                <div className="bg-background-tertiary p-3 rounded-lg max-h-48 overflow-y-auto">
                    {sortedBreakdown.length > 0 ? (
                        <div className="divide-y divide-border-primary">
                            {sortedBreakdown.map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center text-sm py-1.5">
                                <span className="text-content-secondary">{formatFeatureName(key)}</span>
                                <div className="text-right">
                                    <span className="font-mono text-content-primary">{value.tokens.toLocaleString()} tokens</span>
                                    <span className="text-xs text-content-tertiary ml-2 w-16 inline-block text-left">({value.count} calls)</span>
                                </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-content-tertiary text-center py-4">No AI features used yet in this cycle.</p>
                    )}
                </div>
            </div>
            
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