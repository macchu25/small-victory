'use client';

import React, { useState } from 'react';
import { Moon, CheckCircle2, Circle, Trophy, Star, Sparkles, Award, Lock, Check } from 'lucide-react';
import { DayRecord, GoalItem } from '@/types';
import { api } from '@/lib/api';
import { sound } from '@/lib/sounds';
import { fireConfetti } from '@/lib/confetti';

interface EveningSectionProps {
  day: DayRecord;
  onUpdateDay: (updated: DayRecord) => void;
}

export default function EveningSection({ day, onUpdateDay }: EveningSectionProps) {
  const [reflection, setReflection] = useState(day.evening_reflection || '');
  const [mood, setMood] = useState(day.evening_mood || 4);
  const [isDayClosed, setIsDayClosed] = useState(day.is_day_closed || false);
  const [isSaving, setIsSaving] = useState(false);

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
      // If this was the last goal to reach 100%, trigger celebration fanfare & confetti!
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
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Evening Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/30 via-slate-900 to-slate-950 border border-indigo-500/25 p-6 md:p-8">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Moon className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Tổng Kết Cuối Ngày</span>
              <h2 className="text-xl md:text-2xl font-bold text-white">Kiểm Tra Mục Tiêu & Suy Ngẫm</h2>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2 flex items-center gap-3 self-start md:self-auto">
            <div className="text-right">
              <p className="text-xs text-slate-400">Tiến độ ngày</p>
              <p className="text-sm font-bold text-white">
                {completedCount}/{totalCount} mục tiêu ({progressPercent}%)
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
              {progressPercent === 100 ? (
                <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
              ) : (
                <span className="text-xs font-bold text-indigo-400">{progressPercent}%</span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700/50 mb-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-400">
          {progressPercent === 100
            ? '🎉 Xuất sắc! Bạn đã hoàn thành 100% mục tiêu đã đề ra hôm nay!'
            : progressPercent >= 70
            ? '🔥 Rất tuyệt vời! Bạn đã hoàn thành phần lớn các việc quan trọng!'
            : '🌱 Mỗi nỗ lực đều đáng trân trọng. Hãy tích chọn các việc bạn đã làm được.'}
        </p>
      </div>

      {/* Checklist Hiện Lại List Cuối Ngày */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white text-base md:text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" /> Danh Sách Mục Tiêu Đã Đặt Sáng Nay
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tích chọn vào mục tiêu để ghi nhận thành quả ngày hôm nay
            </p>
          </div>
        </div>

        {goals.length > 0 ? (
          <div className="space-y-3">
            {goals.map((goal) => {
              const isDone = goal.completed;
              return (
                <div
                  key={goal.id}
                  onClick={() => handleToggleGoal(goal)}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    isDone
                      ? 'bg-indigo-950/25 border-indigo-500/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      type="button"
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                        isDone
                          ? 'bg-indigo-500 border-indigo-400 text-slate-950 shadow-md shadow-indigo-500/25'
                          : 'border-slate-700 bg-slate-900 hover:border-indigo-400'
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                    </button>

                    <div>
                      <p className={`text-sm md:text-base font-medium transition ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                        {goal.text}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-semibold text-slate-400">
                          {goal.priority === 'must_do' && '🔥 Quan trọng nhất'}
                          {goal.priority === 'should' && '⚡ Cần làm'}
                          {goal.priority === 'bonus' && '🌱 Mở rộng'}
                        </span>
                        {isDone && goal.completed_at && (
                          <span className="text-[11px] text-indigo-300">
                            • Xong lúc {new Date(goal.completed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isDone && (
                    <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Hoàn thành
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-sm">
            Chưa có mục tiêu nào được đặt cho ngày này. Hãy quay lại tab Buổi Sáng để thêm mục tiêu!
          </div>
        )}
      </div>

      {/* Evening Reflection & Mood */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 space-y-5">
        <h3 className="font-bold text-white text-base md:text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" /> Tự Suy Ngẫm Cuối Ngày
        </h3>

        {/* Mood Stars */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">Đánh giá độ hài lòng hôm nay:</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => handleMoodSelect(s)}
                className={`p-2 rounded-xl transition ${
                  mood >= s ? 'text-amber-400 bg-amber-500/10 scale-105' : 'text-slate-600 bg-slate-800/50 hover:text-slate-400'
                }`}
              >
                <Star className="w-6 h-6 fill-current" />
              </button>
            ))}
            <span className="text-xs text-slate-400 ml-2 font-medium">
              {mood === 5 && '🌟 Cực kỳ viên mãn!'}
              {mood === 4 && '😊 Hài lòng và nhẹ nhõm'}
              {mood === 3 && '😐 Tạm ổn, còn việc cần cố gắng'}
              {mood === 2 && '😔 Khá mệt mỏi nhưng đã nỗ lực'}
              {mood === 1 && '🌧️ Ngày thử thách, mai sẽ tốt hơn'}
            </span>
          </div>
        </div>

        {/* Reflection Note */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">
            Hôm nay bạn hài lòng nhất điều gì? Có bài học gì cần đúc kết?
          </label>
          <textarea
            rows={3}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Hôm nay mình vui vì đã kiên trì giải quyết xong việc... Bài học là nên chuẩn bị sớm hơn..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none shadow-inner"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            onClick={() => handleSaveEvening(false)}
            disabled={isSaving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs md:text-sm transition"
          >
            Lưu bản nháp suy ngẫm
          </button>

          <button
            onClick={() => handleSaveEvening(true)}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 text-slate-950 font-bold text-xs md:text-sm hover:brightness-110 shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {isDayClosed ? 'Đã Khóa & Hoàn Thành Ngày' : 'Đóng Dấu Hoàn Thành Ngày 🏆'}
          </button>
        </div>
      </div>
    </div>
  );
}
