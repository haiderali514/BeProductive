import React, { useState, useEffect } from 'react';
import { ActiveView } from './types';
import { Sidebar } from './components/Sidebar';
import { TasksPage } from './components/TasksPage';
import { HabitPage } from './components/HabitPage';
import { PomodoroPage } from './components/PomodoroPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { AchievementsPage } from './components/AchievementsPage';
import { ProfilePage } from './components/ProfilePage';
import { AIAssistantPage } from './components/AIAssistantPage';
import { EisenhowerMatrixPage } from './components/EisenhowerMatrixPage';
import { CountdownPage } from './components/CountdownPage';
import { CalendarPage } from './components/CalendarPage';
import { LandingPage } from './components/auth/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { SettingsModal } from './components/settings/SettingsModal';
import { useAuth } from './contexts/AuthContext';
import { AppProviders } from './contexts/AppProviders';
// FIX: Import hooks to get data and pass it down to page components as props.
import { useData } from './contexts/DataContext';
import { useSettings } from './contexts/SettingsContext';
import { useApiUsage } from './contexts/ApiUsageContext';

const MainApp: React.FC = () => {
    const { isAuthenticated, authView, setAuthView, handleLogin, handleSignup } = useAuth();
    const [activeView, setActiveView] = useState<ActiveView>('tasks');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    // FIX: Get data and functions from contexts to pass as props.
    const { 
        tasks, 
        habits, 
        pomodoroSessions, 
        lists, 
        userProfile, 
        countdowns,
        handleToggleHabit,
        handleAddHabit,
        handleAddPomodoroSession,
        handleUpdateProfile,
        handleAddCountdown,
        handleDeleteCountdown,
        handleUpdateTask,
        handleReorderHabit,
    } = useData();
    const [settings] = useSettings();
    // FIX: `useApiUsage` returns a tuple. Use array destructuring to get `logApiCall`.
    const [apiUsage, logApiCall] = useApiUsage();

    useEffect(() => {
        // Apply font size class to the root <html> element
        const root = document.documentElement;
        const sizeClass = `font-size-${settings.fontSize}`;
        ['font-size-normal', 'font-size-large', 'font-size-extra-large'].forEach(c => root.classList.remove(c));
        root.classList.add(sizeClass);

        // Apply font family class to the <body> element
        const body = document.body;
        ['font-roboto', 'font-arial', 'font-inter', 'font-poppins', 'font-nunito'].forEach(c => body.classList.remove(c));
        if (settings.font !== 'default') {
            body.classList.add(`font-${settings.font}`);
        }
    }, [settings.fontSize, settings.font]);
    
    useEffect(() => {
        // This effect manages a class on the root element when the settings modal
        // is open. This class is used by CSS to force a fixed base font size,
        // preventing the modal from scaling with user preferences.
        const root = document.documentElement;
        if (isSettingsOpen) {
            root.classList.add('settings-modal-open');
        } else {
            root.classList.remove('settings-modal-open');
        }
    }, [isSettingsOpen]);
    
    // This is a simple router to display the correct page component
    const renderActiveView = () => {
        switch (activeView) {
            // FIX: Pass required props to page components.
            case 'tasks': return <TasksPage />;
            case 'calendar': return <CalendarPage tasks={tasks} sessions={pomodoroSessions} lists={lists} onUpdateTask={handleUpdateTask} />;
            case 'pomodoro': return <PomodoroPage sessions={pomodoroSessions} onAddSession={handleAddPomodoroSession} tasks={tasks} habits={habits} />;
            case 'habits': return <HabitPage habits={habits} onToggleHabit={handleToggleHabit} onAddHabit={handleAddHabit} settings={settings} onReorderHabit={handleReorderHabit} />;
            case 'analytics': return <AnalyticsPage tasks={tasks} habits={habits} sessions={pomodoroSessions} lists={lists} profile={userProfile} settings={settings} apiUsage={apiUsage} logApiCall={logApiCall} setActiveView={setActiveView} />;
            case 'achievements': return <AchievementsPage tasks={tasks} habits={habits} sessions={pomodoroSessions} />;
            case 'profile': return <ProfilePage profile={userProfile} onUpdateProfile={handleUpdateProfile} tasks={tasks} settings={settings} logApiCall={logApiCall} />;
            case 'ai-assistant': return <AIAssistantPage />;
            case 'eisenhower-matrix': return <EisenhowerMatrixPage tasks={tasks} />;
            case 'countdown': return <CountdownPage countdowns={countdowns} onAddCountdown={handleAddCountdown} onDeleteCountdown={handleDeleteCountdown} />;
            default: return <TasksPage />;
        }
    };

    if (!isAuthenticated) {
        switch (authView) {
            case 'login': return <LoginPage onLogin={handleLogin} onNavigate={setAuthView} />;
            case 'signup': return <SignupPage onSignup={handleSignup} onNavigate={setAuthView} />;
            case 'landing':
            default: return <LandingPage onNavigate={setAuthView} />;
        }
    }

    return (
        <div className="flex h-screen text-content-primary bg-background-primary">
            <Sidebar 
                activeView={activeView}
                setActiveView={setActiveView}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />
            <main className="flex-1 flex flex-col min-h-0">
                {renderActiveView()}
            </main>
            <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    );
};


const App: React.FC = () => (
    <AppProviders>
        <MainApp />
    </AppProviders>
);

export default App;