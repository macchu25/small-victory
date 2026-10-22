'use client';

import React, { useState, useRef } from 'react';
import { Trophy, Plus, Camera, Image as ImageIcon, Trash2, Tag, Calendar, Sparkles, X, Maximize2, Filter } from 'lucide-react';
import { WinRecord } from '@/types';
import { api, getFullMediaUrl } from '@/lib/api';
import { sound } from '@/lib/sounds';
import { fireConfetti } from '@/lib/confetti';
import CameraModal from './CameraModal';

interface WinsSectionProps {
  wins: WinRecord[];
  currentDate: string;
  onRefreshWins: () => void;
}

const AVAILABLE_TAGS = ['Bản thân', 'Công việc', 'Sức khỏe', 'Học tập', 'Thói quen', 'Khác'];

export default function WinsSection({ wins, currentDate, onRefreshWins }: WinsSectionProps) {
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [tag, setTag] = useState('Bản thân');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenModal = () => {
    setTitle('');
    setNote('');
    setTag('Bản thân');
    setPhotoBase64(null);
    setSelectedFile(null);
    setIsModalOpen(true);
    sound.playPop();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoBase64(event.target.result as string);
          sound.playPop();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (base64: string) => {
    setPhotoBase64(base64);
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    sound.playFanfare();
    fireConfetti();

    try {
      await api.createWin({
        title: title.trim(),
        note: note.trim(),
        tag,
        date: currentDate,
        file: selectedFile || undefined,
        photo_base64: photoBase64 || undefined,
      });
      setIsModalOpen(false);
      onRefreshWins();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWin = async (winId: string) => {
    if (!confirm('Bạn có chắc muốn xoá chiến thắng này?')) return;
    sound.playPop();
    await api.deleteWin(winId);
    onRefreshWins();
  };

  const filteredWins = selectedTagFilter === 'all'
    ? wins
    : wins.filter((w) => w.tag.toLowerCase() === selectedTagFilter.toLowerCase());

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500/15 via-slate-900/95 to-slate-950 border border-rose-500/25 p-5 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-rose-500/20 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-rose-400">
                <Trophy className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Nhật Ký Tự Hào</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  {wins.length} chiến thắng
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">Chiến Thắng Nhỏ</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 font-medium">
                Ghi nhận từng bước tiến nhỏ mỗi ngày với ghi chú & hình ảnh minh chứng.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenModal}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-rose-500/25 hover:brightness-110 active:scale-95 transition self-start sm:self-auto shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" /> Ghi Nhận Chiến Thắng
          </button>
        </div>

        {/* Tag Filters Strip */}
        <div className="relative z-10 flex items-center gap-2 overflow-x-auto no-scrollbar pt-4 mt-4 border-t border-white/5">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Lọc:
          </span>
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              setSelectedTagFilter('all');
            }}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition shrink-0 ${
              selectedTagFilter === 'all'
                ? 'bg-rose-500 text-slate-950 font-bold shadow-md shadow-rose-500/20'
                : 'bg-slate-950/80 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Tất cả ({wins.length})
          </button>
          {AVAILABLE_TAGS.map((t) => {
            const count = wins.filter((w) => w.tag.toLowerCase() === t.toLowerCase()).length;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  sound.playPop();
                  setSelectedTagFilter(t);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1 ${
                  selectedTagFilter.toLowerCase() === t.toLowerCase()
                    ? 'bg-rose-500 text-slate-950 font-bold shadow-md shadow-rose-500/20'
                    : 'bg-slate-950/80 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <span>#{t}</span>
                {count > 0 && <span className="text-[10px] opacity-75">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Wins Cards Grid */}
      {filteredWins.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWins.map((win) => {
            const imgUrl = getFullMediaUrl(win.photo_url);
            return (
              <div
                key={win.id}
                className="group relative rounded-3xl bg-slate-900/60 border border-white/10 hover:border-white/20 overflow-hidden shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Photo Thumbnail */}
                {imgUrl && (
                  <div className="relative aspect-[16/10] w-full bg-black overflow-hidden cursor-pointer">
                    <img
                      src={imgUrl}
                      alt={win.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onClick={() => setPreviewImage(imgUrl)}
                    />
                    <button
                      onClick={() => setPreviewImage(imgUrl)}
                      className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-black/70 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition shadow-lg"
                      title="Phóng to ảnh"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300">
                        #{win.tag}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3" /> {win.date}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-100 text-base leading-snug mb-2 group-hover:text-amber-300 transition">
                      {win.title}
                    </h4>

                    {win.note && (
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                        {win.note}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-amber-400/90 font-semibold text-[11px]">
                      <Sparkles className="w-3.5 h-3.5" /> Chiến thắng nhỏ
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteWin(win.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      title="Xóa chiến thắng"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-dashed border-white/10 p-8 shadow-inner">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/10">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-white text-lg">Chưa có chiến thắng nào trong mục này</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
            Dù là từ chối một ly trà sữa, đi bộ 10 phút, hay viết xong 1 đoạn code khó — tất cả đều là chiến thắng xứng đáng được ăn mừng!
          </p>
          <button
            onClick={handleOpenModal}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold text-sm shadow-md shadow-rose-500/25 hover:brightness-110 active:scale-95 transition"
          >
            + Ghi nhận chiến thắng đầu tiên
          </button>
        </div>
      )}

      {/* Modal Thêm Chiến Thắng Nhỏ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-white/15 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/90">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> Ghi Nhận Chiến Thắng Nhỏ
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Chiến thắng hôm nay của bạn là gì? <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Đã kiên trì chạy bộ 2km dù trời mưa..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                />
              </div>

              {/* Tag Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">Chọn danh mục (Tag):</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        tag === t
                          ? 'bg-rose-500 text-slate-950 font-bold shadow-md shadow-rose-500/25'
                          : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/5'
                      }`}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note / Details */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">Ghi chú / Cảm xúc:</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Cảm thấy rất tự hào vì đã vượt qua sự lười biếng..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition resize-none leading-relaxed"
                />
              </div>

              {/* Photo Input (Cloudinary / Live Camera) */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Đính kèm hình ảnh minh chứng (Tùy chọn):
                </label>

                {photoBase64 ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/15 group bg-black">
                    <img src={photoBase64} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoBase64(null);
                        setSelectedFile(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-white hover:bg-rose-600 transition shadow-lg"
                      title="Gỡ ảnh"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="p-4 rounded-2xl border border-dashed border-white/10 hover:border-rose-500/50 bg-slate-950/60 flex flex-col items-center justify-center gap-2 hover:bg-slate-950 transition text-slate-300 hover:text-white group"
                    >
                      <Camera className="w-6 h-6 text-rose-400 group-hover:scale-110 transition" />
                      <span className="text-xs font-semibold">Chụp trực tiếp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 rounded-2xl border border-dashed border-white/10 hover:border-amber-500/50 bg-slate-950/60 flex flex-col items-center justify-center gap-2 hover:bg-slate-950 transition text-slate-300 hover:text-white group"
                    >
                      <ImageIcon className="w-6 h-6 text-amber-400 group-hover:scale-110 transition" />
                      <span className="text-xs font-semibold">Tải từ máy</span>
                    </button>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-rose-500/25 hover:brightness-110 active:scale-95 transition"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Chiến Thắng 🏆'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fadeIn"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={previewImage} alt="Enlarged" className="max-w-full max-h-[85vh] rounded-3xl object-contain shadow-2xl border border-white/10" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white rounded-full bg-slate-800/80"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        title="Chụp ảnh minh chứng chiến thắng"
      />
    </div>
  );
}
