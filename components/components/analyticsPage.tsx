import React, { useMemo, useState, useCallback } from 'react';
import { Task, Habit, PomodoroSession, List, Priority, UserProfile, AIContext, ActiveView, Achievement, Level, AppData } from '../types';
import { generateWeeklyReview, generateAnalyticsInsights } from '../services/geminiService';
import { WeeklyReviewModal } from './WeeklyReviewModal';
import { Settings } from '../hooks/useSettings';
import { ApiFeature, ApiUsage, FEATURE_NAMES } from '../hooks/useApiUsage';
import { BarChart, PieChart, Bar, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AIAssistantIcon, TrophyIcon } from './Icons';
import { ACHIEVEMENTS_LIST, LEVELS, calculateAchievementScore } from '../constants';


type AnalyticsFilter = 'dashboard' | 'tasks' | 'focus' | 'habits';

interface AnalyticsPageProps {
  tasks: Task[];
  habits: Habit[];
  sessions: PomodoroSession[];
  lists: List[];
  profile: UserProfile;
  settings: Settings;
  apiUsage: ApiUsage;
  logApiCall: (feature: ApiFeature, tokens: number) => void;
  setActiveView: (view: ActiveView) => void;
}

const toYYYYMMDD = (date: Date): string => {
    const d = new Date(date);
    const