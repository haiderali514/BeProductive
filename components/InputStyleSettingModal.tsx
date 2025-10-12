import React from 'react';
import { Settings } from '../hooks/useSettings';
import { CloseIcon, CalendarIcon, MoreIcon, FlagIcon, TagIcon, MoveToListIcon } from './Icons';

interface InputStyleSettingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSettingsChange: (newSettings: Partial<Settings>) => void;
    currentStyle: 'simple' | 'detailed';
}

const CheckmarkCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);


export const InputStyleSettingModal: React.FC<InputStyleSettingModalProps> = ({ isOpen, onClose, onSettingsChange, currentStyle }) => {
    if (!isOpen) return null;

    const handleSelect = (style: 'simple' | 'detailed') => {
        onSettingsChange({ taskInputStyle: style });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background-secondary rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border-primary flex justify-between items-center">
                    <h2 className="text-xl font-bold text-content-primary">Input Box Setting</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-content-tertiary hover:bg-background-tertiary">
                        <CloseIcon className="w-5 h-5"/>
                    </button>
                </div>
                <div className="p-6 grid grid-cols-2 gap-6">
                    {/* Simple Style */}
                    <div onClick={() => handleSelect('simple')} className="cursor-pointer space-y-3 flex flex-col items-center">
                        <div className={`relative w-full p-4 border-2 rounded-lg ${currentStyle === 'simple' ? 'border-primary' : 'border-border-primary'}`}>
                            <div className="bg-background-primary p-2 rounded-lg border border-border-primary flex items-center">
                                <span className="text-content-secondary text-sm flex-1">+ Add Task</span>
                                <div className="flex items-center space-x-1">
                                    <CalendarIcon className="h-5 w-5 text-content-tertiary" />
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                            {currentStyle === 'simple' && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary/80 rounded-full p-2">
                                    <CheckmarkCircleIcon />
                                </div>
                            )}
                        </div>
                        <span className="text-content-primary">Simple</span>
                    </div>

                    {/* Detailed Style */}
                    <div onClick={() => handleSelect('detailed')} className="cursor-pointer space-y-3 flex flex-col items-center">
                         <div className={`relative w-full p-4 border-2 rounded-lg ${currentStyle === 'detailed' ? 'border-primary' : 'border-border-primary'}`}>
                            <div className="bg-background-primary p-2 rounded-lg border border-border-primary">
                                <p className="text-content-secondary text-sm">What would you like to do?</p>
                                <div className="flex justify-between items-center mt-2">
                                    <div className="flex items-center space-x-1">
                                        <div className="flex items-center text-xs text-primary bg-primary/20 px-1.5 py-0.5 rounded"><CalendarIcon className="w-3 h-3 mr-1"/>Today</div>
                                        <FlagIcon className="w-4 h-4 text-content-tertiary" />
                                        <TagIcon className="w-4 h-4 text-content-tertiary" />
                                        <MoveToListIcon className="w-4 h-4 text-content-tertiary" />
                                        <MoreIcon className="w-4 h-4 text-content-tertiary" />
                                    </div>
                                    <button className="px-3 py-1 bg-primary text-white rounded text-xs">Add</button>
                                </div>
                            </div>
                            {currentStyle === 'detailed' && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary/80 rounded-full p-2">
                                    <CheckmarkCircleIcon />
                                </div>
                            )}
                        </div>
                        <span className="text-content-primary">Detailed</span>
                    </div>
                </div>
            </div>
        </div>
    );
};