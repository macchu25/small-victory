'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Download, Flame, Calendar, BarChart3, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { sound } from '@/lib/sounds';

interface HeaderProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  streak: number;
  onOpenStats: () => void;
}

export default function Header({ selectedDate, onSelectDate, streak, onOpenStats }: HeaderProps) {
  const [muted, setMuted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    setMuted(sound.getMuted());

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleToggleSound = () => {
    const isMutedNow = sound.toggleMute();
    setMuted(isMutedNow);
    if (!isMutedNow) {
      sound.playPop();
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
    }
    setDeferredPrompt(null);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  // Generate 7-day strip (3 days before, today, 3 days after or up to today)
  const getDaysStrip = () => {
    const dates = [];
    const base = new Date();
    for (let i = -4; i <= 2; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const str = d.toISOString().split('T')[0];
      const weekday = d.toLocaleDateString('vi-VN', { weekday: 'short' });
      const dayNum = d.getDate();
      dates.push({ dateStr: str, weekday, dayNum, isToday: str === todayStr });
    }
    return dates;
  };

  const daysStrip = getDaysStrip();

  const handleDateShift = (direction: -1 | 1) => {
    sound.playPop();
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + direction);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-slate-950/80 border-b border-white/5 transition-all">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Top Row: Brand & Tools */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <div className="relative group shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 p-[1.5px] shadow-lg shadow-amber-500/20 group-hover:scale-105 transition duration-300">
                <div className="w-full h-full bg-slate-950 rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
                  <span className="text-base sm:text-xl filter drop-shadow">🏆</span>
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent truncate">
                  Small Victory
                </h1>
                {streak > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold shrink-0">
                    <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{streak}d</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block truncate">
                Khởi đầu có chủ đích • Khép lại trong tự hào
              </p>
            </div>
          </div>

          {/* Action Utilities */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Native Calendar Picker button */}
            <div className="relative flex items-center bg-slate-900/90 border border-white/10 hover:border-amber-500/40 rounded-xl px-2 sm:px-2.5 py-1.5 text-xs text-slate-300 transition">
              <Calendar className="w-3.5 h-3.5 text-amber-400 sm:mr-1.5 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  sound.playPop();
                  onSelectDate(e.target.value);
                }}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer w-20 sm:w-28 font-medium text-[11px] sm:text-xs"
              />
            </div>

            {/* Stats Button */}
            <button
              onClick={() => {
                sound.playPop();
                onOpenStats();
              }}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Thống kê hành trình"
            >
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Thống kê</span>
            </button>

            {/* Sound Toggle Button */}
            <button
              onClick={handleToggleSound}
              className="p-2 rounded-xl bg-slate-900/90 border border-white/10 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition"
              title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            {/* PWA Install Button */}
            {canInstall && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95 transition"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Cài App</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Row: 7-Day Quick Strip Navigator */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/5">
          <button
            onClick={() => handleDateShift(-1)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
            title="Ngày trước đó"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-0.5 px-1">
            {daysStrip.map((item) => {
              const isSelected = item.dateStr === selectedDate;
              return (
                <button
                  key={item.dateStr}
                  onClick={() => {
                    sound.playPop();
                    onSelectDate(item.dateStr);
                  }}
                  className={`flex flex-col items-center justify-center min-w-[42px] sm:min-w-[50px] py-1 px-2 rounded-xl text-xs transition-all ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md shadow-amber-500/30 scale-105'
                      : item.isToday
                      ? 'bg-slate-900 text-amber-400 border border-amber-500/40 font-semibold hover:bg-slate-800'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 font-medium'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider">{item.weekday}</span>
                  <span className="text-xs sm:text-sm">{item.dayNum}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handleDateShift(1)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
            title="Ngày tiếp theo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
