import React, { useState, useEffect } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CloseIcon } from './Icons';

interface WeeklyReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: () => Promise<string>;
}

export const WeeklyReviewModal: React.FC<WeeklyReviewModalProps> = ({ isOpen, onClose, onGenerate }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reviewContent, setReviewContent] = useState<string>('');
    
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            setError(null);
            setReviewContent('');
            
            onGenerate()
                .then(content => setReviewContent(content))
                .catch(e => setError(e.message || "An unknown error occurred."))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, onGenerate]);
    
    if (!isOpen) return null;

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="text-content-secondary">Aura is analyzing your week...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-red-500 mb-4">Could not generate your weekly review.</p>
                    <p className="text-sm text-content-tertiary">{error}</p>
                </div>
            );
        }
        
        return <MarkdownRenderer text={reviewContent} />;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background-secondary rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border-primary flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-content-primary">Your Weekly Review ✨</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-content-tertiary hover:bg-background-tertiary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    {renderContent()}
                </div>

                <div className="p-4 bg-background-primary rounded-b-lg flex justify-end">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-6 py-2 rounded-md bg-primary hover:bg-primary-focus text-white font-semibold transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};