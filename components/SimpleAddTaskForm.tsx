import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, Priority, AddTaskFormProps } from '../types';
import { CalendarIcon, FlagIcon, AttachmentIcon, TemplateIcon, SettingsIcon, PlusIcon } from './Icons';
import { Popover } from './Popover';
import { DatePickerPopover } from './SmartAddTaskForm';
import { useTaskForm } from '../hooks/useTaskForm';

type ActivePopover = 'date' | 'options';

export const SimpleAddTaskForm: React.FC<AddTaskFormProps> = ({ lists, onAddTask, aiEnabled, activeListId, logApiCall, onSettingsChange, onDeactivate, autoFocus }) => {
    const {
        title, dueDate, priority,
        isLoading, error,
        setTitle, setDueDate, setPriority,
        handleSubmit, resetForm,
    } = useTaskForm({ lists, onAddTask, aiEnabled, activeListId, logApiCall, onDeactivate: () => {} });
    
    const [isFocused, setIsFocused] = useState(false);
    const [activePopover, setActivePopover] = useState<ActivePopover | null>(null);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const dateTriggerRef = useRef<HTMLButtonElement>(null);
    const optionsTriggerRef = useRef<HTMLButtonElement>(null);
    
    const handleFocus = () => setIsFocused(true);

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        // Timeout to allow popover clicks
        setTimeout(() => {
            if (!containerRef.current?.contains(document.activeElement)) {
                 if (!title.trim()) {
                    setIsFocused(false);
                 }
            }
        }, 100);
    };
    
    useEffect(() => {
        if (inputRef.current && title !== inputRef.current.textContent) {
            inputRef.current.textContent = title;
        }
    }, [title]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        setTitle(e.currentTarget.textContent || '');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
            // After submit, if successful, useTaskForm resets title, which should trigger blur logic
            if (inputRef.current) inputRef.current.blur();
        }
        if(e.key === 'Escape') {
            if (inputRef.current) inputRef.current.blur();
        }
    };
    
    useEffect(() => {
        if (!isLoading) {
            if (!title.trim()) {
                setIsFocused(false);
            }
        }
    }, [isLoading, title]);


    const handleSwitchStyle = (e: React.MouseEvent) => {
        e.preventDefault();
        onSettingsChange({ taskInputStyle: 'detailed' });
        setActivePopover(null);
    };
    
    const priorityOptions = [
        { level: Priority.HIGH, color: 'text-red-500' },
        { level: Priority.MEDIUM, color: 'text-yellow-500' },
        { level: Priority.LOW, color: 'text-blue-500' },
        { level: Priority.NONE, color: 'text-content-tertiary' },
    ];

    if (!isFocused) {
         return (
            <div className="px-4 pt-4 bg-background-primary">
                <div 
                    onClick={() => {
                        setIsFocused(true);
                        setTimeout(() => inputRef.current?.focus(), 0);
                    }}
                    className="w-full flex items-center px-4 py-2.5 bg-background-secondary rounded-lg cursor-text border border-transparent"
                >
                    <div className="flex items-center text-content-secondary">
                        <PlusIcon />
                        <span className="ml-2">Add task</span>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <>
        <div ref={containerRef} onBlur={handleBlur} className="px-4 pt-4 bg-background-primary">
             <div className="border border-primary rounded-lg">
                <form onSubmit={handleSubmit}>
                    <div className="task-input text-sm overflow-x-hidden flex p-3">
                         <div className="relative flex-auto">
                            <div
                                ref={inputRef}
                                contentEditable
                                suppressContentEditableWarning
                                onInput={handleInput}
                                onKeyDown={handleKeyDown}
                                className="relative z-10 outline-none min-h-[24px] text-content-primary"
                            ></div>
                         </div>
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex justify-end clear-both px-2 pb-2"
                    >
                      <div className="inline-flex items-center gap-1">
                        <button ref={dateTriggerRef} type="button" onClick={() => setActivePopover(p => p === 'date' ? null : 'date')} className="p-1.5 rounded text-content-secondary hover:bg-background-tertiary"><CalendarIcon className="h-5 w-5"/></button>
                        <button ref={optionsTriggerRef} type="button" onClick={() => setActivePopover(p => p === 'options' ? null : 'options')} className="p-1.5 rounded text-content-secondary hover:bg-background-tertiary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </motion.div>
                </form>
            </div>
        </div>
        <Popover isOpen={activePopover === 'date'} onClose={() => setActivePopover(null)} triggerRef={dateTriggerRef} position="bottom-end">
            <div className="bg-background-tertiary rounded-lg shadow-2xl border border-border-primary text-content-primary">
                 <DatePickerPopover selectedDate={dueDate} onDateChange={setDueDate} onClose={() => setActivePopover(null)} />
            </div>
        </Popover>
        <Popover isOpen={activePopover === 'options'} onClose={() => setActivePopover(null)} triggerRef={optionsTriggerRef} position="bottom-end">
             <div className="w-64 bg-background-tertiary rounded-lg shadow-2xl border border-border-primary text-content-primary p-2">
                <div>
                    <span className="px-2 text-xs text-content-tertiary">Priority:</span>
                    <div className="flex justify-around p-2">
                        {priorityOptions.map(opt => (
                            <button key={opt.level} onClick={() => setPriority(opt.level)} className={`p-1 rounded ${priority === opt.level ? 'bg-primary/20' : ''}`}><FlagIcon className={`h-5 w-5 ${opt.color}`} /></button>
                        ))}
                    </div>
                </div>
                <div className="border-t border-border-primary my-1"></div>
                <button className="w-full flex justify-between items-center p-2 rounded hover:bg-background-primary"><span>Inbox</span><span>&gt;</span></button>
                <button className="w-full text-left flex items-center p-2 rounded hover:bg-background-primary">Tags</button>
                <div className="border-t border-border-primary my-1"></div>
                <button className="w-full text-left flex items-center p-2 rounded hover:bg-background-primary"><AttachmentIcon className="mr-2"/> Attachment</button>
                <button className="w-full text-left flex items-center p-2 rounded hover:bg-background-primary"><TemplateIcon className="mr-2"/> Add from Template</button>
                <div className="border-t border-border-primary my-1"></div>
                 <button
                    onMouseDown={handleSwitchStyle}
                    className="w-full text-left flex items-center p-2 rounded hover:bg-background-primary"
                >
                    <SettingsIcon className="mr-2 h-5 w-5"/> Switch to Detailed
                </button>
             </div>
        </Popover>
        </>
    );
};