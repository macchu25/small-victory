'use client';

import React from 'react';
import { X, Flame, Trophy, CheckCircle, Calendar, Sparkles } from 'lucide-react';
import { StatsResponse } from '@/types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: StatsResponse | null;
}

export default function StatsModal({ isOpen, onClose, stats }: StatsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              📊
            </div>
            <h3 className="font-bold text-white text-lg">Thống Kê Hành Trình</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {stats ? (
          <div className="space-y-4">
            {/* Grid Stats */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 mb-1">
                  <Flame className="w-5 h-5 fill-amber-500" />
                  <span className="text-xs font-semibold uppercase">Chuỗi ngày</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.streak} ngày liên tiếp</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Giữ vững phong độ!</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-2 text-rose-400 mb-1">
                  <Trophy className="w-5 h-5" />
                  <span className="text-xs font-semibold uppercase">Chiến Thắng</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.total_wins}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Khoảnh khắc tự hào</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-xs font-semibold uppercase">Tỷ lệ xong</span>
                </div>
                <p className="text-2xl font-bold text-white">{Math.round(stats.completion_rate)}%</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {stats.completed_goals}/{stats.total_goals} mục tiêu
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400 mb-1">
                  <Calendar className="w-5 h-5" />
                  <span className="text-xs font-semibold uppercase">Ngày ghi nhận</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.total_days_count} ngày</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Đã đồng hành cùng app</p>
              </div>
            </div>

            {/* Motivational Badge */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/20 flex items-center gap-3">
              <span className="text-2xl">🌱</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                "Thành công không đến từ những bước nhảy vọt khổng lồ, mà là tập hợp của những chiến thắng nhỏ mỗi ngày."
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">Đang tải thống kê...</div>
        )}
      </div>
    </div>
  );
}
