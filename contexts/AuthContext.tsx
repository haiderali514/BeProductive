
import React, { createContext, useState, useCallback, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

type AuthView = 'landing' | 'login' | 'signup';

interface User {
    email: string;
    pass: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    authView: AuthView;
    setAuthView: (view: AuthView) => void;
    handleSignup: (email: string, pass: string) => boolean;
    handleLogin: (email: string, pass: string) => boolean;
    handleLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('app_isAuthenticated', true);
    const [users, setUsers] = useLocalStorage<User[]>('app_users', []);
    const [authView, setAuthView] = useState<AuthView>('landing');

    const handleSignup = useCallback((email: string, pass: string): boolean => {
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return false;
        }
        setUsers(prev => [...prev, { email, pass }]);
        setIsAuthenticated(true);
        return true;
    }, [users, setUsers, setIsAuthenticated]);

    const handleLogin = useCallback((email: string, pass: string): boolean => {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.pass === pass);
        if (user) {
            setIsAuthenticated(true);
            return true;
        }
        return false;
    }, [users, setIsAuthenticated]);

    const handleLogout = useCallback(() => {
        setIsAuthenticated(false);
        setAuthView('landing');
    }, [setIsAuthenticated]);
    
    const value = { isAuthenticated, authView, setAuthView, handleSignup, handleLogin, handleLogout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
