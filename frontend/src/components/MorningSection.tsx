'use client';

import React, { useState } from 'react';
import { Sun, Camera, Plus, Trash2, CheckCircle2, Zap, Sparkles, Image as ImageIcon, Flame } from 'lucide-react';
import { DayRecord, GoalItem, GoalPriority } from '@/types';
import { api, getFullMediaUrl } from '@/lib/api';
import { sound } from '@/lib/sounds';
import CameraModal from './CameraModal';

interface MorningSectionProps {
  day: DayRecord;
  onUpdateDay: (updated: DayRecord) => void;
}

export default function MorningSection({ day, onUpdateDay }: MorningSectionProps) {
  const [intention, setIntention] = useState(day.morning_intention || '');
  const [energy, setEnergy] = useState(day.energy || 3);
  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalPriority, setNewGoalPriority] = useState<GoalPriority>('must_do');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSavingIntention, setIsSavingIntention] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Sync state if day changes
  React.useEffect(() => {
    setIntention(day.morning_intention || '');
    setEnergy(day.energy || 3);
  }, [day.date, day.morning_intention, day.energy]);

  const handleSaveIntention = async () => {
    setIsSavingIntention(true);
    sound.playPop();
    try {
      const updated = await api.updateIntention(day.date, intention, energy);
      onUpdateDay(updated);
    } finally {
      setIsSavingIntention(false);
    }
  };

  const handleEnergySelect = async (level: number) => {
    setEnergy(level);
    sound.playPop();
    const updated = await api.updateIntention(day.date, intention, level);
    onUpdateDay(updated);
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;

    sound.playPop();
    const text = newGoalText.trim();
    setNewGoalText('');
    const updated = await api.addGoal(day.date, text, newGoalPriority);
    onUpdateDay(updated);
  };

  const handleDeleteGoal = async (goalId: string) => {
    sound.playPop();
    const updated = await api.deleteGoal(day.date, goalId);
    onUpdateDay(updated);
  };

  const handlePhotoCaptured = async (base64: string) => {
    setIsUploadingPhoto(true);
    try {
      const updated = await api.uploadMorningPhoto(day.date, { base64 });
      onUpdateDay(updated);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const priorityLabels: Record<GoalPriority, { label: string; icon: string; style: string }> = {
    must_do: { label: 'Quan trọng nhất', icon: '🔥', style: 'border-rose-500/40 bg-rose-500/10 text-rose-300' },
    should: { label: 'Cần làm', icon: '⚡', style: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
    bonus: { label: 'Mở rộng', icon: '🌱', style: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
  };

  const photoUrl = getFullMediaUrl(day.morning_photo_url);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Morning Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 border border-amber-500/20 p-6 md:p-8">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sun className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Khởi Đầu Ngày Mới</span>
              <h2 className="text-xl md:text-2xl font-bold text-white">Mục Đích & Năng Lượng</h2>
            </div>
          </div>

          {/* Energy Rating Bar */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl p-2 self-start md:self-auto">
            <span className="text-xs font-medium text-slate-400 px-2 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Năng lượng:
            </span>
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                onClick={() => handleEnergySelect(lvl)}
                className={`w-8 h-8 rounded-xl font-bold text-xs transition-all ${
                  energy === lvl
                    ? 'bg-amber-500 text-slate-950 scale-105 shadow-md shadow-amber-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title={`Mức năng lượng ${lvl}/5`}
              >
                {lvl}⚡
              </button>
            ))}
          </div>
        </div>

        {/* Morning Core Intention Input */}
        <div className="space-y-3">
          <label className="block text-xs font-medium text-slate-300">
            Tâm niệm / Ý niệm cốt lõi hôm nay (Daily One Big Intention):
          </label>
          <div className="relative">
            <textarea
              rows={2}
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="Hôm nay mình chọn sống với sự tập trung, bình thản và hoàn thành xuất sắc..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 text-slate-100 placeholder-slate-500 text-sm md:text-base focus:outline-none focus:border-amber-500 transition resize-none shadow-inner"
            />
            <button
              onClick={handleSaveIntention}
              disabled={isSavingIntention}
              className="absolute bottom-3 right-3 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isSavingIntention ? 'Đang lưu...' : 'Lưu tâm niệm'}
            </button>
          </div>
        </div>
      </div>

      {/* Morning Photo Card (Chụp 1 tấm ảnh đầu ngày) */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base md:text-lg">Khoảnh Khắc Đầu Ngày (Morning Snap)</h3>
          </div>
          <button
            onClick={() => setIsCameraOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-semibold text-xs md:text-sm hover:brightness-110 shadow-md shadow-amber-500/20 transition"
          >
            <Camera className="w-4 h-4" />
            {photoUrl ? 'Chụp lại ảnh mới' : 'Chụp 1 tấm hình'}
          </button>
        </div>

        {photoUrl ? (
          <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 group">
            <img
              src={photoUrl}
              alt="Morning Snap"
              className="w-full h-64 md:h-80 object-cover group-hover:scale-102 transition duration-500"
            />
            {/* Watermark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1 font-semibold text-amber-300">
                  <Sun className="w-4 h-4" /> Khởi đầu ngày {day.date}
                </span>
                <span className="bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-700">
                  {day.morning_photo_time
                    ? new Date(day.morning_photo_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    : 'Sáng nay'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsCameraOpen(true)}
            className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-8 text-center cursor-pointer transition bg-slate-950/40 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
              <Camera className="w-7 h-7" />
            </div>
            <p className="font-semibold text-slate-200 text-sm">Chụp 1 tấm hình để lưu lại khởi đầu ngày hôm nay</p>
            <p className="text-xs text-slate-500 mt-1">Ảnh ly cà phê, góc làm việc, bầu trời sớm mai hoặc nụ cười của bạn</p>
          </div>
        )}
      </div>

      {/* Morning Action Items / Goals List */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white text-base md:text-lg flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" /> Danh Sách Mục Tiêu Cần Chinh Phục
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Đặt ra lúc sáng, tối nay bạn sẽ quay lại kiểm tra xem đã hoàn thành chưa!
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
            {day.goals?.length || 0} mục tiêu
          </span>
        </div>

        {/* Add Goal Form */}
        <form onSubmit={handleAddGoal} className="flex flex-col sm:flex-row gap-2 mb-5">
          <input
            type="text"
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
            placeholder="Thêm mục tiêu cho ngày hôm nay..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />

          <div className="flex gap-2">
            <select
              value={newGoalPriority}
              onChange={(e) => setNewGoalPriority(e.target.value as GoalPriority)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition"
            >
              <option value="must_do">🔥 Quan trọng nhất</option>
              <option value="should">⚡ Cần làm</option>
              <option value="bonus">🌱 Mở rộng</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs md:text-sm transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" /> Thêm
            </button>
          </div>
        </form>

        {/* Goals List Preview */}
        {day.goals && day.goals.length > 0 ? (
          <div className="space-y-2.5">
            {day.goals.map((goal) => {
              const pInfo = priorityLabels[goal.priority] || priorityLabels.must_do;
              return (
                <div
                  key={goal.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${pInfo.style}`}>
                      {pInfo.icon} {pInfo.label}
                    </span>
                    <span className={`text-sm text-slate-200 truncate ${goal.completed ? 'line-through text-slate-500' : ''}`}>
                      {goal.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {goal.completed && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Xong
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition rounded-lg hover:bg-slate-800"
                      title="Xoá mục tiêu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs">
            Chưa có mục tiêu nào được đặt cho ngày hôm nay. Hãy bắt đầu với 1-3 việc quan trọng nhất!
          </div>
        )}
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handlePhotoCaptured}
        title="Chụp 1 tấm ảnh đầu ngày"
      />
    </div>
  );
}
