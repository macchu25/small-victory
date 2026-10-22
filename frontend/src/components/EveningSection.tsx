'use client';

import React, { useState } from 'react';
import { Moon, CheckCircle2, Trophy, Star, Sparkles, Award, Lock, Check, Calendar, Heart, Zap } from 'lucide-react';
import { DayRecord, GoalItem } from '@/types';
import { api } from '@/lib/api';
import { sound } from '@/lib/sounds';
import { fireConfetti } from '@/lib/confetti';

interface EveningSectionProps {
  day: DayRecord;
  onUpdateDay: (updated: DayRecord) => void;
}

const MOOD_RATINGS = [
  { star: 1, label: 'Thử thách, mai sẽ tốt hơn', emoji: '🌧️' },
  { star: 2, label: 'Hơi mệt mỏi nhưng đã nỗ lực', emoji: '☕' },
  { star: 3, label: 'Tạm ổn, có việc cần rút kinh nghiệm', emoji: '🌱' },
  { star: 4, label: 'Hài lòng và nhẹ nhõm', emoji: '😊' },
  { star: 5, label: 'Cực kỳ viên mãn, tự hào!', emoji: '🌟' },
];

export default function EveningSection({ day, onUpdateDay }: EveningSectionProps) {
  const [reflection, setReflection] = useState(day.evening_reflection || '');
  const [mood, setMood] = useState(day.evening_mood || 4);
  const [isDayClosed, setIsDayClosed] = useState(day.is_day_closed || false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  React.useEffect(() => {
    setReflection(day.evening_reflection || '');
    setMood(day.evening_mood || 4);
    setIsDayClosed(day.is_day_closed || false);
  }, [day.date, day.evening_reflection, day.evening_mood, day.is_day_closed]);

  const goals = day.goals || [];
  const completedCount = goals.filter((g) => g.completed).length;
  const totalCount = goals.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggleGoal = async (goal: GoalItem) => {
    const nextCompleted = !goal.completed;
    if (nextCompleted) {
      sound.playCheck();
      if (completedCount + 1 === totalCount) {
        sound.playFanfare();
        fireConfetti();
      } else {
        fireConfetti();
      }
    } else {
      sound.playPop();
    }

    const updated = await api.updateGoal(day.date, goal.id, { completed: nextCompleted });
    onUpdateDay(updated);
  };

  const handleMoodSelect = (star: number) => {
    setMood(star);
    sound.playPop();
  };

  const handleSaveEvening = async (closeDay = false) => {
    setIsSaving(true);
    sound.playPop();
    if (closeDay) {
      sound.playFanfare();
      fireConfetti();
    }
    try {
      const closed = closeDay ? true : isDayClosed;
      setIsDayClosed(closed);
      const updated = await api.submitEveningReview(day.date, reflection, mood, closed);
      onUpdateDay(updated);
      if (!closeDay) {
        setHasSavedDraft(true);
        setTimeout(() => setHasSavedDraft(false), 2000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Evening Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-950 border border-indigo-500/25 p-5 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-indigo-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-400">
                <Moon className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Lắng Đọng Cuối Ngày</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {day.date}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Kiểm Tra Mục Tiêu & Suy Ngẫm</h2>
            </div>
          </div>

          {/* Progress Ring / Pill */}
          <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-3.5 self-start md:self-auto shadow-lg">
            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Hoàn thành</span>
              <p className="text-sm font-black text-white">
                {completedCount}/{totalCount} việc ({progressPercent}%)
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                {progressPercent === 100 ? (
                  <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
                ) : (
                  <span className="text-xs font-black text-indigo-400">{progressPercent}%</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Multi-stop Progress Bar */}
        <div className="relative z-10 space-y-2">
          <div className="w-full bg-slate-950 rounded-full h-3.5 overflow-hidden p-0.5 border border-white/10 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 transition-all duration-700 ease-out shadow-lg"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {progressPercent === 100
                ? '🎉 Trọn vẹn 100%! Ngày hôm nay là một thắng lợi vẻ vang của bạn!'
                : progressPercent >= 60
                ? '🔥 Phong độ rất tốt! Bạn đã hoàn thành phần lớn các việc quan trọng.'
                : '🌱 Mỗi nỗ lực nhỏ đều đáng tự hào. Hãy tích chọn những việc bạn đã làm được.'}
            </span>
          </div>
        </div>
      </div>

      {/* Checklist Hiện Lại List Mục Tiêu */}
      <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 sm:p-7 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" /> Danh Sách Mục Tiêu Đã Đặt Sáng Nay
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chạm vào mục tiêu để đánh dấu hoàn thành và kích hoạt pháo hoa ăn mừng 🎆
            </p>
          </div>
        </div>

        {goals.length > 0 ? (
          <div className="space-y-2.5">
            {goals.map((goal) => {
              const isDone = goal.completed;
              return (
                <div
                  key={goal.id}
                  onClick={() => handleToggleGoal(goal)}
                  className={`group flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-200 select-none ${
                    isDone
                      ? 'bg-indigo-950/30 border-indigo-500/40 shadow-sm'
                      : 'bg-slate-950/70 border-white/5 hover:border-white/20 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      type="button"
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                        isDone
                          ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 border-indigo-400 text-slate-950 shadow-md shadow-indigo-500/30'
                          : 'border-slate-700 bg-slate-900 group-hover:border-indigo-400'
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                    </button>

                    <div>
                      <p
                        className={`text-sm sm:text-base font-semibold transition ${
                          isDone ? 'line-through text-slate-500' : 'text-slate-100'
                        }`}
                      >
                        {goal.text}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {goal.priority === 'must_do' && '🔥 Quan trọng nhất'}
                          {goal.priority === 'should' && '⚡ Cần làm'}
                          {goal.priority === 'bonus' && '🌱 Mở rộng'}
                        </span>
                        {isDone && goal.completed_at && (
                          <span className="text-[10px] text-indigo-300 font-medium">
                            • Xong lúc {new Date(goal.completed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isDone && (
                    <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center gap-1 shrink-0 animate-fadeIn">
                      <Sparkles className="w-3.5 h-3.5" /> Hoàn thành
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-dashed border-white/10 text-slate-500 text-sm">
            Chưa có mục tiêu nào được đặt cho ngày này. Hãy quay lại tab Buổi Sáng để thêm mục tiêu!
          </div>
        )}
      </div>

      {/* Evening Reflection & Mood */}
      <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 sm:p-7 shadow-xl space-y-6">
        <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" /> Tự Suy Ngẫm & Chấm Điểm Ngày
        </h3>

        {/* Mood Stars Rating */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-2">Đánh giá độ hài lòng hôm nay:</label>
          <div className="flex flex-wrap items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleMoodSelect(s)}
                className={`p-2 rounded-xl transition ${
                  mood >= s ? 'text-amber-400 bg-amber-500/10 scale-105' : 'text-slate-600 bg-slate-950 hover:text-slate-400'
                }`}
              >
                <Star className="w-6 h-6 fill-current" />
              </button>
            ))}
            <span className="text-xs sm:text-sm font-semibold text-amber-300 ml-1">
              {MOOD_RATINGS.find((m) => m.star === mood)?.emoji} {MOOD_RATINGS.find((m) => m.star === mood)?.label}
            </span>
          </div>
        </div>

        {/* Reflection Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-2">
            Hôm nay điều gì làm bạn hài lòng nhất? Có bài học gì đúc kết cho ngày mai?
          </label>
          <textarea
            rows={3}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Ví dụ: Hôm nay mình vui vì đã giữ lời hứa với bản thân, hoàn thành đúng deadline... Ngày mai sẽ bắt đầu sớm hơn 15 phút..."
            className="w-full bg-slate-950/80 border border-white/10 focus:border-indigo-500 rounded-2xl p-4 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none transition resize-none shadow-inner leading-relaxed"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-white/5">
          {hasSavedDraft && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-fadeIn mr-auto">
              <CheckCircle2 className="w-3.5 h-3.5" /> Đã lưu bản nháp suy ngẫm
            </span>
          )}

          <button
            type="button"
            onClick={() => handleSaveEvening(false)}
            disabled={isSaving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition"
          >
            Lưu bản nháp
          </button>

          <button
            type="button"
            onClick={() => handleSaveEvening(true)}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 text-slate-950 font-black text-xs sm:text-sm hover:brightness-110 active:scale-95 shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4 stroke-[2.5]" />
            {isDayClosed ? 'Đã Khóa & Hoàn Thành Ngày' : 'Đóng Dấu Hoàn Thành Ngày 🏆'}
          </button>
        </div>
      </div>
    </div>
  );
}
