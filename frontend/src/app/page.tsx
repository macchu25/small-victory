'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import MorningSection from '@/components/MorningSection';
import EveningSection from '@/components/EveningSection';
import WinsSection from '@/components/WinsSection';
import StatsModal from '@/components/StatsModal';
import { DayRecord, StatsResponse, WinRecord } from '@/types';
import { api } from '@/lib/api';
import { sound } from '@/lib/sounds';
import { Sun, Moon, Trophy, Sparkles } from 'lucide-react';

export default function Home() {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const createDefaultDay = (date: string): DayRecord => ({
    date,
    morning_intention: '',
    energy: 3,
    goals: [],
    evening_reflection: '',
    evening_mood: 3,
    is_day_closed: false,
  });

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [activeTab, setActiveTab] = useState<'morning' | 'evening' | 'wins'>('morning');
  const [dayData, setDayData] = useState<DayRecord>(() => createDefaultDay(getTodayStr()));
  const [wins, setWins] = useState<WinRecord[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Auto detect morning or evening on initial load
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 17) {
      setActiveTab('evening');
    } else {
      setActiveTab('morning');
    }
  }, []);

  // Fetch day data and wins whenever selectedDate changes
  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const loadData = async (date: string) => {
    setIsSyncing(true);
    try {
      const [fetchedDay, fetchedWins, fetchedStats] = await Promise.all([
        api.getDay(date),
        api.getWins(date),
        api.getStats(),
      ]);
      if (fetchedDay) setDayData(fetchedDay);
      if (fetchedWins) setWins(fetchedWins);
      if (fetchedStats) setStats(fetchedStats);
    } catch (e) {
      console.warn('Sync notice:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTabChange = (tab: 'morning' | 'evening' | 'wins') => {
    sound.playPop();
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans pb-28 md:pb-12 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header */}
      <Header
        selectedDate={selectedDate}
        onSelectDate={(newDate) => {
          setSelectedDate(newDate);
          setDayData(createDefaultDay(newDate));
        }}
        streak={stats?.streak || 0}
        onOpenStats={() => setIsStatsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-7">
        {/* Sync Indicator (subtle pill) */}
        {isSyncing && (
          <div className="flex items-center justify-center gap-2 mb-3 text-xs text-amber-400/90 font-medium animate-pulse">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Đang đồng bộ dữ liệu với máy chủ...</span>
          </div>
        )}

        {/* Navigation Tabs (Desktop / Tablet Segmented Control) */}
        <div className="hidden sm:flex items-center justify-center p-1.5 bg-slate-900/90 border border-white/10 rounded-2xl max-w-lg mx-auto mb-7 shadow-xl backdrop-blur-xl">
          <button
            onClick={() => handleTabChange('morning')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs md:text-sm font-bold transition-all duration-300 ${
              activeTab === 'morning'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 scale-102'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>🌅 Buổi Sáng</span>
          </button>

          <button
            onClick={() => handleTabChange('evening')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs md:text-sm font-bold transition-all duration-300 ${
              activeTab === 'evening'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 scale-102'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>🌙 Cuối Ngày</span>
          </button>

          <button
            onClick={() => handleTabChange('wins')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs md:text-sm font-bold transition-all duration-300 ${
              activeTab === 'wins'
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 shadow-lg shadow-rose-500/25 scale-102'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>🏆 Chiến Thắng</span>
          </button>
        </div>

        {/* Content Views */}
        <div>
          {activeTab === 'morning' && (
            <MorningSection
              day={dayData}
              onUpdateDay={(updated) => setDayData(updated)}
            />
          )}

          {activeTab === 'evening' && (
            <EveningSection
              day={dayData}
              onUpdateDay={(updated) => setDayData(updated)}
            />
          )}

          {activeTab === 'wins' && (
            <WinsSection
              wins={wins}
              currentDate={selectedDate}
              onRefreshWins={() => loadData(selectedDate)}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Dock Bar (Glassmorphic Thumb Reach) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 px-4 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => handleTabChange('morning')}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-2xl transition-all duration-300 ${
            activeTab === 'morning'
              ? 'text-amber-400 font-extrabold scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sun className="w-5 h-5" />
          <span className="text-[11px]">Buổi Sáng</span>
        </button>

        <button
          onClick={() => handleTabChange('evening')}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-2xl transition-all duration-300 ${
            activeTab === 'evening'
              ? 'text-indigo-400 font-extrabold scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Moon className="w-5 h-5" />
          <span className="text-[11px]">Cuối Ngày</span>
        </button>

        <button
          onClick={() => handleTabChange('wins')}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-2xl transition-all duration-300 ${
            activeTab === 'wins'
              ? 'text-rose-400 font-extrabold scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[11px]">Chiến Thắng</span>
        </button>
      </nav>

      {/* Stats Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
      />
    </div>
  );
}
