'use client';

import React, { useState } from 'react';
import { Sun, Camera, Plus, Trash2, CheckCircle2, Zap, Sparkles, Image as ImageIcon, Flame, Clock, Heart, Award } from 'lucide-react';
import { DayRecord, GoalItem, GoalPriority } from '@/types';
import { api, getFullMediaUrl } from '@/lib/api';
import { sound } from '@/lib/sounds';
import CameraModal from './CameraModal';

interface MorningSectionProps {
  day: DayRecord;
  onUpdateDay: (updated: DayRecord) => void;
}

const QUICK_SUGGESTIONS = [
  '💧 Uống đủ 2L nước',
  '🏃‍♂️ Vận động / Thể dục 20 phút',
  '📖 Đọc 10 trang sách',
  '🧘‍♀️ Tĩnh tâm 5 phút',
  '🎯 Giải quyết việc khó nhất trước 11h',
];

const ENERGY_LEVELS = [
  { level: 1, label: 'Uể oải', emoji: '🥱' },
  { level: 2, label: 'Cần nạp năng lượng', emoji: '☕' },
  { level: 3, label: 'Sẵn sàng', emoji: '⚡' },
  { level: 4, label: 'Sung sức', emoji: '🔥' },
  { level: 5, label: 'Bất khả chiến bại', emoji: '🚀' },
];

export default function MorningSection({ day, onUpdateDay }: MorningSectionProps) {
  const [intention, setIntention] = useState(day.morning_intention || '');
  const [energy, setEnergy] = useState(day.energy || 3);
  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalPriority, setNewGoalPriority] = useState<GoalPriority>('must_do');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSavingIntention, setIsSavingIntention] = useState(false);
  const [hasSavedIntention, setHasSavedIntention] = useState(false);

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
      setHasSavedIntention(true);
      setTimeout(() => setHasSavedIntention(false), 2000);
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

  const handleAddGoal = async (textToAdd: string, priority: GoalPriority = newGoalPriority) => {
    if (!textToAdd.trim()) return;

    sound.playPop();
    setNewGoalText('');
    const updated = await api.addGoal(day.date, textToAdd.trim(), priority);
    onUpdateDay(updated);
  };

  const handleDeleteGoal = async (goalId: string) => {
    sound.playPop();
    const updated = await api.deleteGoal(day.date, goalId);
    onUpdateDay(updated);
  };

  const handlePhotoCaptured = async (base64: string) => {
    sound.playFanfare();
    const updated = await api.uploadMorningPhoto(day.date, { base64 });
    onUpdateDay(updated);
  };

  const priorityLabels: Record<GoalPriority, { label: string; icon: string; style: string }> = {
    must_do: { label: 'Quan trọng nhất', icon: '🔥', style: 'border-rose-500/40 bg-rose-500/15 text-rose-300' },
    should: { label: 'Cần làm', icon: '⚡', style: 'border-amber-500/40 bg-amber-500/15 text-amber-300' },
    bonus: { label: 'Mở rộng', icon: '🌱', style: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300' },
  };

  const photoUrl = getFullMediaUrl(day.morning_photo_url);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Hero Sunrise Intention Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/15 via-slate-900/95 to-slate-950 border border-amber-500/25 p-5 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-amber-500/20 via-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 p-0.5 shadow-lg shadow-amber-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
                <Sun className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Khởi Đầu Có Chủ Đích</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {day.date}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Tâm Niệm Đầu Ngày</h2>
            </div>
          </div>

          {/* Interactive Energy Bar */}
          <div className="bg-slate-950/70 backdrop-blur-md border border-white/10 rounded-2xl p-2 flex flex-col gap-1.5 self-start md:self-auto">
            <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-slate-300">
              <span className="flex items-center gap-1 text-amber-400">
                <Zap className="w-3.5 h-3.5 fill-amber-400" /> Năng lượng sáng:
              </span>
              <span className="text-amber-300">
                {ENERGY_LEVELS.find((e) => e.level === energy)?.emoji} {ENERGY_LEVELS.find((e) => e.level === energy)?.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {ENERGY_LEVELS.map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => handleEnergySelect(item.level)}
                  className={`flex-1 py-1 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    energy === item.level
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/30 scale-105'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={item.label}
                >
                  <span>{item.emoji}</span>
                  <span className="hidden sm:inline">{item.level}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Intention Textarea */}
        <div className="relative z-10 space-y-2.5">
          <label className="block text-xs font-semibold text-slate-200">
            Điều quan trọng nhất bạn muốn dành trọn tâm trí hôm nay (One Big Intention):
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="Ví dụ: Giữ tâm trí bình thản, tập trung 100% hoàn thành xong báo cáo trước 16h và dành buổi tối cho bản thân..."
              className="w-full bg-slate-950/80 border border-white/15 focus:border-amber-500 rounded-2xl p-4 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none transition shadow-inner resize-none leading-relaxed"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              {hasSavedIntention && (
                <span className="text-xs text-emerald-400 font-semibold animate-fadeIn flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã lưu
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveIntention}
                disabled={isSavingIntention}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 shadow-md shadow-amber-500/25 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isSavingIntention ? 'Đang lưu...' : 'Lưu tâm niệm'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Morning Snapshot (Left) + Goals List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Morning Photo Card (5 cols on large screen) */}
        <div className="lg:col-span-5 rounded-3xl bg-slate-900/60 border border-white/10 p-5 sm:p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">Khoảnh Khắc Sớm Mai</h3>
            </div>
            <button
              onClick={() => setIsCameraOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-xs hover:brightness-110 shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              {photoUrl ? 'Chụp lại' : 'Chụp ảnh'}
            </button>
          </div>

          {photoUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-white/15 aspect-[3/4] w-full max-w-[280px] sm:max-w-[320px] mx-auto shadow-2xl group bg-black">
              <img
                src={photoUrl}
                alt="Morning Snapshot"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              {/* Sleek Watermark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/20 flex flex-col justify-between p-4 pointer-events-none">
                <div className="flex justify-end">
                  <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-semibold text-amber-300 border border-white/10">
                    🌅 Khởi đầu ngày
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white tracking-wide">{day.date}</p>
                  <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {day.morning_photo_time
                      ? new Date(day.morning_photo_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                      : 'Sáng nay'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsCameraOpen(true)}
              className="border-2 border-dashed border-white/10 hover:border-amber-500/50 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition bg-slate-950/40 group flex flex-col items-center justify-center aspect-[3/4] max-w-[280px] sm:max-w-[320px] w-full mx-auto"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition shadow-inner">
                <Camera className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-200 text-sm mb-1">Chụp 1 tấm ảnh nửa thân</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-[200px]">
                Có sẵn khung căn chỉnh nửa thân trên giúp ảnh mỗi sáng đều tề chỉnh đồng đều.
              </p>
            </div>
          )}
        </div>

        {/* Goals Checklist Planner (7 cols on large screen) */}
        <div className="lg:col-span-7 rounded-3xl bg-slate-900/60 border border-white/10 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-400" /> Mục Tiêu Cần Chinh Phục
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Đặt ra lúc sáng, tối nay bạn sẽ quay lại kiểm tra xem đã hoàn thành chưa!
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-amber-300 border border-white/5">
                {day.goals?.length || 0} việc
              </span>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="mb-4">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Gợi ý nhanh 1 chạm:</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleAddGoal(sug, 'should')}
                    className="text-[11px] py-1 px-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/5 transition flex items-center gap-1 active:scale-95"
                  >
                    <span>+</span> {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Goal Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddGoal(newGoalText);
              }}
              className="flex flex-col sm:flex-row gap-2 mb-4"
            >
              <input
                type="text"
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                placeholder="Thêm mục tiêu cụ thể hôm nay..."
                className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />

              <div className="flex gap-2">
                <select
                  value={newGoalPriority}
                  onChange={(e) => setNewGoalPriority(e.target.value as GoalPriority)}
                  className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="must_do">🔥 Quan trọng nhất</option>
                  <option value="should">⚡ Cần làm</option>
                  <option value="bonus">🌱 Mở rộng</option>
                </select>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 shadow-md shadow-amber-500/20 transition flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Thêm
                </button>
              </div>
            </form>

            {/* Goals List */}
            {day.goals && day.goals.length > 0 ? (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {day.goals.map((goal) => {
                  const pInfo = priorityLabels[goal.priority] || priorityLabels.must_do;
                  return (
                    <div
                      key={goal.id}
                      className="group flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 hover:border-white/15 transition shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${pInfo.style}`}>
                          {pInfo.icon} {pInfo.label}
                        </span>
                        <span className={`text-sm text-slate-200 truncate ${goal.completed ? 'line-through text-slate-500' : ''}`}>
                          {goal.text}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {goal.completed && (
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã xong
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition opacity-80 group-hover:opacity-100"
                          title="Xóa mục tiêu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-white/10 rounded-2xl">
                Chưa có mục tiêu nào. Hãy bắt đầu với 1-3 việc quan trọng nhất bạn muốn giải quyết hôm nay!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Camera Viewfinder Modal with Torso Guide */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handlePhotoCaptured}
        title="Chụp 1 tấm ảnh khởi đầu ngày"
      />
    </div>
  );
}
