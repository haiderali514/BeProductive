import React, { useState, useEffect } from 'react';
import { Countdown } from '../types';
import { AddCountdownModal } from './AddCountdownModal';
import { TrashIcon } from './Icons';

interface CountdownPageProps {
  countdowns: Countdown[];
  onAddCountdown: (title: string, date: string) => void;
  onDeleteCountdown: (id: string) => void;
}

interface TimeLeft {
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
}

const useTimeRemaining = (targetDate: string): TimeLeft => {
    const calculateTimeLeft = (): TimeLeft => {
        const difference = +new Date(targetDate) - +new Date();
        if (difference > 0) {
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return {};
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    return timeLeft;
};

const TimeUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="flex flex-col items-center">
        <span className="text-4xl md:text-5xl font-bold text-content-primary tabular-nums">{String(value).padStart(2, '0')}</span>
        <span className="text-xs text-content-tertiary uppercase tracking-widest">{label}</span>
    </div>
);

const CountdownItem: React.FC<{ countdown: Countdown; onDelete: (id: string) => void }> = ({ countdown, onDelete }) => {
    const timeLeft = useTimeRemaining(countdown.date);
    const targetDate = new Date(countdown.date);
    const hasFinished = Object.keys(timeLeft).length === 0;

    return (
        <div className="bg-background-secondary rounded-lg p-4 shadow-lg flex flex-col relative group">
            <h3 className="text-xl font-bold text-center mb-4 text-primary truncate">{countdown.title}</h3>
            {hasFinished ? (
                 <div className="flex-1 flex items-center justify-center">
                    <p className="text-2xl font-bold text-green-400">Event Finished!</p>
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-4 my-4">
                    <TimeUnit value={timeLeft.days ?? 0} label="Days" />
                    <TimeUnit value={timeLeft.hours ?? 0} label="Hours" />
                    <TimeUnit value={timeLeft.minutes ?? 0} label="Minutes" />
                    <TimeUnit value={timeLeft.seconds ?? 0} label="Seconds" />
                </div>
            )}
            <p className="text-center text-sm text-content-secondary mt-auto">
                {targetDate.toLocaleString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
            </p>
            <button
                onClick={() => onDelete(countdown.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-background-tertiary text-content-tertiary hover:bg-red-500/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete countdown"
            >
                <TrashIcon />
            </button>
        </div>
    );
};

export const CountdownPage: React.FC<CountdownPageProps> = ({ countdowns, onAddCountdown, onDeleteCountdown }) => {
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  return (
    <>
      <div className="p-6 flex-1 flex flex-col h-full overflow-hidden">
        <header className="flex justify-between items-center mb-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-content-primary">Countdown</h1>
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-focus transition-colors flex items-center space-x-2"
          >
            <span>Add Countdown</span>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto -mr-4 pr-4">
            {countdowns.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                    {countdowns.map(cd => (
                        <CountdownItem key={cd.id} countdown={cd} onDelete={onDeleteCountdown} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-content-secondary">
                    <p>No countdowns yet.</p>
                    <p>Click "Add Countdown" to get started.</p>
                </div>
            )}
        </main>
      </div>
      <AddCountdownModal 
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAddCountdown={onAddCountdown}
      />
    </>
  );
};