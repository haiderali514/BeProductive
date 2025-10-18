import React, { useState, useEffect } from 'react';
import { Recurrence } from '../types';
import { SunIcon, TomorrowIcon, Plus7Icon, MoonIcon, ChevronLeftIcon, TimeIcon, ReminderIcon, RepeatIcon, ChevronRightIcon } from './Icons';
import { Popover } from './Popover';

type View = 'main' | 'time' | 'reminder' | 'repeat' | 'startTime' | 'endTime';

export interface DateTimePickerResult {
    startDate: string | null;
    dueDate: string | null; // for duration, this is endDate
    isAllDay: boolean;
    reminder: string | null;
    recurrence: Recurrence | null;
}

interface DateTimePickerPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (result: DateTimePickerResult) => void;
    initialValue: Partial<DateTimePickerResult>;
    // FIX: Add triggerRef to props to allow popover positioning
    triggerRef: React.RefObject<HTMLElement | null>;
    onMouseDown?: (e: React.MouseEvent) => void;
}

const toDateString = (date: Date | null) => date ? date.toISOString().slice(0, 16).replace('T', ' ') : null;

export const DateTimePickerPopover: React.FC<DateTimePickerPopoverProps> = ({ isOpen, onClose, onSave, initialValue, triggerRef, onMouseDown }) => {
    const [activeTab, setActiveTab] = useState<'Date' | 'Duration'>('Date');
    const [view, setView] = useState<View>('main');
    
    // Internal state
    const [date, setDate] = useState<Date | null>(initialValue.dueDate ? new Date(initialValue.dueDate.replace(' ', 'T')) : null);
    const [startDate, setStartDate] = useState<Date>(initialValue.startDate ? new Date(initialValue.startDate.replace(' ', 'T')) : new Date());
    const [endDate, setEndDate] = useState<Date>(initialValue.dueDate ? new Date(initialValue.dueDate.replace(' ', 'T')) : new Date(Date.now() + 60 * 60 * 1000));
    const [isAllDay, setIsAllDay] = useState(initialValue.isAllDay || false);
    const [reminder, setReminder] = useState<string | null>(initialValue.reminder || null);
    const [recurrence, setRecurrence] = useState<Recurrence | null>(initialValue.recurrence || null);

    const [calendarViewDate, setCalendarViewDate] = useState(date || new Date());

    const handleSave = () => {
        if (activeTab === 'Date') {
            onSave({
                startDate: null,
                dueDate: toDateString(date),
                isAllDay: false,
                reminder,
                recurrence
            });
        } else {
            onSave({
                startDate: toDateString(startDate),
                dueDate: toDateString(endDate),
                isAllDay,
                reminder,
                recurrence
            });
        }
        onClose();
    };

    const handleClear = () => {
        setDate(null);
        setReminder(null);
        setRecurrence(null);
        // Don't close, let user confirm with OK
    };

    const renderMainDateView = () => {
        const monthName = calendarViewDate.toLocaleString('default', { month: 'long' });
        const year = calendarViewDate.getFullYear();
        const daysInMonth = new Date(year, calendarViewDate.getMonth() + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, calendarViewDate.getMonth(), 1).getDay();

        const changeMonth = (offset: number) => {
            setCalendarViewDate(prev => {
                const newDate = new Date(prev);
                newDate.setDate(1);
                newDate.setMonth(newDate.getMonth() + offset);
                return newDate;
            });
        };

        const handleDayClick = (day: number) => {
            const newDate = new Date(calendarViewDate);
            newDate.setDate(day);
            if(date) { // preserve time
                newDate.setHours(date.getHours(), date.getMinutes());
            }
            setDate(newDate);
        };
        
        const setQuickDate = (daysOffset: number) => {
            const newDate = new Date();
            newDate.setDate(newDate.getDate() + daysOffset);
            setDate(newDate);
        };

        return (
            <>
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <button title="Today" onClick={() => setQuickDate(0)} className="py-1.5 bg-background-primary rounded hover:bg-border-primary"><SunIcon className="w-4 h-4 mx-auto" /></button>
                    <button title="Tomorrow" onClick={() => setQuickDate(1)} className="py-1.5 bg-background-primary rounded hover:bg-border-primary"><TomorrowIcon className="w-4 h-4 mx-auto" /></button>
                    <button title="Next week" onClick={() => setQuickDate(7)} className="py-1.5 bg-background-primary rounded hover:bg-border-primary"><Plus7Icon className="w-4 h-4 mx-auto" /></button>
                    <button title="No date" onClick={() => setDate(null)} className="py-1.5 bg-background-primary rounded hover:bg-border-primary"><MoonIcon className="w-4 h-4 mx-auto" /></button>
                </div>

                <div className="flex justify-between items-center mb-2">
                    <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-border-primary text-content-secondary"><ChevronLeftIcon className="w-4 h-4" /></button>
                    <span className="font-semibold text-sm">{monthName} {year}</span>
                    <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-border-primary text-content-secondary"><ChevronRightIcon className="w-4 h-4"/></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-content-tertiary">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 mt-1">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`}></div>)}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const isSelected = date?.getDate() === day && date?.getMonth() === calendarViewDate.getMonth() && date?.getFullYear() === calendarViewDate.getFullYear();
                        return (
                           <button type="button" key={day} onClick={() => handleDayClick(day)} className={`w-8 h-8 rounded-full text-sm ${isSelected ? 'bg-primary text-white' : 'hover:bg-background-tertiary'}`}>
                               {day}
                           </button>
                       );
                    })}
               </div>
            </>
        )
    }
    
    const renderTimeView = () => (
        <div>
            <h3 className="font-semibold mb-2">Set Time</h3>
             <input 
                type="time" 
                value={date ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` : '09:00'}
                onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    const newDate = date || new Date();
                    newDate.setHours(hours, minutes);
                    setDate(new Date(newDate));
                }}
                className="w-full bg-background-primary border border-border-primary rounded-md px-3 py-2" 
            />
            <button onClick={() => setView('main')} className="mt-4 text-sm text-primary">Back</button>
        </div>
    );
    const renderTimeViewFor = (type: 'start' | 'end') => {
        const current = type === 'start' ? startDate : endDate;
        const setter = type === 'start' ? setStartDate : setEndDate;
        return (
            <div>
                <h3 className="font-semibold mb-2">Set {type === 'start' ? 'Start' : 'End'} Time</h3>
                 <input 
                    type="time" 
                    value={`${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}`}
                    onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':').map(Number);
                        const newDate = new Date(current);
                        newDate.setHours(hours, minutes);
                        setter(newDate);
                    }}
                    className="w-full bg-background-primary border border-border-primary rounded-md px-3 py-2" 
                />
                <div className="flex justify-between mt-4">
                    <button onClick={() => setView('main')} className="text-sm text-primary">Back</button>
                    <button onClick={() => setView('main')} className="px-3 py-1 rounded-md text-sm bg-primary text-white">OK</button>
                </div>
            </div>
        );
    };

    const renderReminderView = () => {
        const options = ['On-time', '5 minutes before', '10 minutes before', '1 hour before', '1 day before'];
        return (
            <div>
                 <h3 className="font-semibold mb-2 flex items-center"><ReminderIcon className="w-4 h-4 mr-2"/>Reminder</h3>
                 <div className="flex flex-col items-start space-y-2">
                    {options.map(opt => (
                        <button key={opt} onClick={() => { setReminder(opt); setView('main'); }} className="text-sm hover:text-primary">{opt}</button>
                    ))}
                 </div>
                 <button onClick={() => setView('main')} className="mt-4 text-sm text-primary">Back</button>
            </div>
        );
    };
    
    const renderRepeatView = () => {
        const options = Object.values(Recurrence);
         return (
            <div>
                 <h3 className="font-semibold mb-2 flex items-center"><RepeatIcon className="w-4 h-4 mr-2"/>Repeat</h3>
                 <div className="flex flex-col items-start space-y-2">
                    {options.map(opt => (
                        <button key={opt} onClick={() => { setRecurrence(opt); setView('main'); }} className="text-sm hover:text-primary">{opt}</button>
                    ))}
                 </div>
                 <button onClick={() => setView('main')} className="mt-4 text-sm text-primary">Back</button>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <Popover isOpen={isOpen} onClose={onClose} triggerRef={triggerRef} position="bottom-start">
            <div onMouseDown={onMouseDown} className="w-80 bg-[#2f2f2f] rounded-lg shadow-xl border border-border-primary p-4 text-white">
                <div className="flex space-x-1 bg-background-tertiary p-1 rounded-lg mb-4">
                    <button onClick={() => setActiveTab('Date')} className={`flex-1 py-1 text-sm font-semibold rounded ${activeTab==='Date' ? 'bg-primary' : ''}`}>Date</button>
                    <button onClick={() => setActiveTab('Duration')} className={`flex-1 py-1 text-sm font-semibold rounded ${activeTab==='Duration' ? 'bg-primary' : ''}`}>Duration</button>
                </div>
                
                {view === 'main' && (
                    <>
                        {activeTab === 'Date' ? (
                            <>
                                {renderMainDateView()}
                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border-primary text-sm">
                                    <button onClick={() => setView('time')} className="flex items-center space-x-2 hover:text-primary"><TimeIcon className="w-4 h-4" /><span>Set Time</span></button>
                                    <button onClick={() => setView('reminder')} className="flex items-center space-x-2 hover:text-primary"><ReminderIcon className="w-4 h-4" /><span>{reminder || 'Reminder'}</span></button>
                                    <button onClick={() => setView('repeat')} className="flex items-center space-x-2 hover:text-primary"><RepeatIcon className="w-4 h-4" /><span>{recurrence || 'Repeat'}</span></button>
                                </div>
                            </>
                        ) : (
                             <>
                                <div className="space-y-2">
                                    <button onClick={() => setView('startTime')} className="w-full text-left p-2 bg-background-primary rounded">Start: {startDate.toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</button>
                                    <button onClick={() => setView('endTime')} className="w-full text-left p-2 bg-background-primary rounded">End: {endDate.toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</button>
                                </div>
                                <label className="flex items-center space-x-2 mt-4 text-sm"><input type="checkbox" checked={isAllDay} onChange={e => setIsAllDay(e.target.checked)} /><span>All Day</span></label>
                             </>
                        )}
                    </>
                )}
                
                {view === 'time' && renderTimeView()}
                {view === 'reminder' && renderReminderView()}
                {view === 'repeat' && renderRepeatView()}
                {view === 'startTime' && renderTimeViewFor('start')}
                {view === 'endTime' && renderTimeViewFor('end')}
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border-primary">
                    <button onClick={handleClear} className="px-4 py-2 text-sm rounded-md hover:bg-background-tertiary">Clear</button>
                    <div className="space-x-2">
                        <button onClick={onClose} className="px-4 py-2 text-sm rounded-md hover:bg-background-tertiary">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary-focus">OK</button>
                    </div>
                </div>
            </div>
        </Popover>
    );
};