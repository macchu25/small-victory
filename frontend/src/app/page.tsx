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
import { Sun, Moon, Trophy } from 'lucide-react';

export default function Home() {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [activeTab, setActiveTab] = useState<'morning' | 'evening' | 'wins'>('morning');
  const [dayData, setDayData] = useState<DayRecord | null>(null);
  const [wins, setWins] = useState<WinRecord[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
    setIsLoading(true);
    try {
      const [fetchedDay, fetchedWins, fetchedStats] = await Promise.all([
        api.getDay(date),
        api.getWins(date),
        api.getStats(),
      ]);
      setDayData(fetchedDay);
      setWins(fetchedWins);
      setStats(fetchedStats);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: 'morning' | 'evening' | 'wins') => {
    sound.playPop();
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24 md:pb-12 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header */}
      <Header
        selectedDate={selectedDate}
        onSelectDate={(newDate) => setSelectedDate(newDate)}
        streak={stats?.streak || 0}
        onOpenStats={() => setIsStatsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 md:py-8">
        {/* Navigation Tabs (Desktop / Tablet) */}
        <div className="hidden sm:flex items-center justify-center p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl max-w-md mx-auto mb-8 shadow-inner">
          <button
            onClick={() => handleTabChange('morning')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs md:text-sm font-semibold transition-all ${
              activeTab === 'morning'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>🌅 Buổi Sáng</span>
          </button>

          <button
            onClick={() => handleTabChange('evening')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs md:text-sm font-semibold transition-all ${
              activeTab === 'evening'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>🌙 Cuối Ngày</span>
          </button>

          <button
            onClick={() => handleTabChange('wins')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs md:text-sm font-semibold transition-all ${
              activeTab === 'wins'
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>🏆 Chiến Thắng</span>
          </button>
        </div>

        {/* Content Views */}
        {isLoading || !dayData ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Đang đồng bộ dữ liệu...</p>
          </div>
        ) : (
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
        )}
      </main>

      {/* Mobile Bottom Dock Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2 flex items-center justify-around">
        <button
          onClick={() => handleTabChange('morning')}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition ${
            activeTab === 'morning' ? 'text-amber-400 font-bold scale-105' : 'text-slate-500'
          }`}
        >
          <Sun className="w-5 h-5" />
          <span className="text-[11px]">Buổi Sáng</span>
        </button>

        <button
          onClick={() => handleTabChange('evening')}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition ${
            activeTab === 'evening' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-500'
          }`}
        >
          <Moon className="w-5 h-5" />
          <span className="text-[11px]">Cuối Ngày</span>
        </button>

        <button
          onClick={() => handleTabChange('wins')}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition ${
            activeTab === 'wins' ? 'text-rose-400 font-bold scale-105' : 'text-slate-500'
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
