'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Download, Flame, Calendar, BarChart3, Sun, Moon } from 'lucide-react';
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

    // Listen for PWA install event
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

  // Format date display in Vietnamese: "Thứ Năm, 22 Tháng 10"
  const formattedDate = new Date(selectedDate).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-violet-600 p-0.5 shadow-lg shadow-amber-500/10 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <span className="text-xl">🏆</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-amber-200 bg-clip-text text-transparent">
                Small Victory
              </h1>
              {streak > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{streak} ngày</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Khởi đầu có chủ đích • Khép lại trong tự hào</p>
          </div>
        </div>

        {/* Date Selector & Action Tools */}
        <div className="flex items-center gap-2">
          {/* Quick Date Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            />
            {!isToday && (
              <button
                onClick={() => onSelectDate(todayStr)}
                className="ml-1.5 px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded font-medium hover:bg-amber-500/30 transition text-[11px]"
              >
                Hôm nay
              </button>
            )}
          </div>

          {/* Stats Button */}
          <button
            onClick={onOpenStats}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            title="Xem thống kê"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* PWA Install Button */}
          {canInstall && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-semibold text-xs shadow-md shadow-amber-500/20 hover:brightness-110 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cài App</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
