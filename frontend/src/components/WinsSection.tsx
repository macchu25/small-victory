'use client';

import React, { useState, useRef } from 'react';
import { Trophy, Plus, Camera, Image as ImageIcon, Trash2, Tag, Calendar, Sparkles, X, Maximize2 } from 'lucide-react';
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500/15 via-slate-900 to-slate-950 border border-rose-500/20 p-6 md:p-8">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Nhật Ký Tự Hào</span>
              <h2 className="text-xl md:text-2xl font-bold text-white">Chiến Thắng Nhỏ (Micro-Wins)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ghi nhận từng bước tiến nhỏ mỗi ngày với ghi chú & hình ảnh minh chứng.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-rose-500/25 hover:brightness-110 active:scale-95 transition self-start sm:self-auto"
          >
            <Plus className="w-5 h-5" /> Ghi Nhận Chiến Thắng
          </button>
        </div>
      </div>

      {/* Wins Cards Grid */}
      {wins.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {wins.map((win) => {
            const imgUrl = getFullMediaUrl(win.photo_url);
            return (
              <div
                key={win.id}
                className="group relative rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 overflow-hidden shadow-lg transition duration-300 flex flex-col"
              >
                {/* Photo Thumbnail */}
                {imgUrl && (
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer">
                    <img
                      src={imgUrl}
                      alt={win.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onClick={() => setPreviewImage(imgUrl)}
                    />
                    <button
                      onClick={() => setPreviewImage(imgUrl)}
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"
                      title="Phóng to ảnh"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 border border-rose-500/25 text-rose-300">
                        #{win.tag}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {win.date}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-100 text-base leading-snug mb-1.5 group-hover:text-amber-300 transition">
                      {win.title}
                    </h4>

                    {win.note && (
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-3">
                        {win.note}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-amber-400/80 font-medium">
                      <Sparkles className="w-3.5 h-3.5" /> Chiến thắng nhỏ
                    </span>
                    <button
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
        <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800 p-8">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-white text-lg">Chưa có chiến thắng nào được ghi lại</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Dù là từ chối một ly trà sữa, đi bộ 10 phút, hay viết xong 1 đoạn code khó — tất cả đều là chiến thắng xứng đáng được ăn mừng!
          </p>
          <button
            onClick={handleOpenModal}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition"
          >
            + Ghi nhận chiến thắng đầu tiên
          </button>
        </div>
      )}

      {/* Modal Thêm Chiến Thắng Nhỏ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> Ghi Nhận Chiến Thắng Nhỏ
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Chiến thắng của bạn hôm nay là gì? <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Đã tập thể dục 20 phút, Không trì hoãn..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                />
              </div>

              {/* Tag Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Chọn danh mục (Tag):</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                        tag === t
                          ? 'bg-rose-500 text-slate-950 font-bold shadow-md shadow-rose-500/25'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note / Details */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ghi chú / Cảm xúc:</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Cảm thấy tự hào vì dù trời mưa nhưng mình vẫn kiên trì..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition resize-none"
                />
              </div>

              {/* Photo Input (Cloudinary / Live Camera) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Đính kèm hình ảnh minh chứng (Tùy chọn):
                </label>

                {photoBase64 ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700 group">
                    <img src={photoBase64} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoBase64(null);
                        setSelectedFile(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition"
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
                      className="p-4 rounded-2xl border border-dashed border-slate-800 hover:border-rose-500/50 bg-slate-950/60 flex flex-col items-center justify-center gap-2 hover:bg-slate-950 transition text-slate-300 hover:text-white"
                    >
                      <Camera className="w-6 h-6 text-rose-400" />
                      <span className="text-xs font-medium">Chụp trực tiếp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 rounded-2xl border border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-950/60 flex flex-col items-center justify-center gap-2 hover:bg-slate-950 transition text-slate-300 hover:text-white"
                    >
                      <ImageIcon className="w-6 h-6 text-amber-400" />
                      <span className="text-xs font-medium">Tải từ thiết bị</span>
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
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs md:text-sm transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold text-xs md:text-sm shadow-lg shadow-rose-500/25 hover:brightness-110 transition"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={previewImage} alt="Enlarged" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
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
