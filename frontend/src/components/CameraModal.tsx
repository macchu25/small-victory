'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, Image as ImageIcon, UserCheck, Eye, EyeOff } from 'lucide-react';
import { sound } from '@/lib/sounds';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64: string) => void;
  title?: string;
}

export default function CameraModal({ isOpen, onClose, onCapture, title = 'Chụp ảnh khoảnh khắc' }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true); // Khung căn chỉnh từ giữa thân trở lên
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, capturedImage]);

  const startCamera = async () => {
    setCameraError(null);
    stopCamera();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: unknown) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Không thể mở máy ảnh. Bạn có thể chọn ảnh từ thư viện thiết bị.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    sound.playPop();
  };

  const toggleGuide = () => {
    sound.playPop();
    setShowGuide((prev) => !prev);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;

    sound.playShutter();
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    // Save in portrait 3:4 crop to match the torso-up framing
    const targetWidth = video.videoWidth || 960;
    const targetHeight = video.videoHeight || 1280;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        // Mirror selfie camera
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
    }
    stopCamera();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImage(event.target.result as string);
          sound.playPop();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmCapture = () => {
    if (capturedImage) {
      sound.playCheck();
      onCapture(capturedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setCameraError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 z-20">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="font-semibold text-slate-100 text-sm md:text-base">{title}</h3>
          </div>

          <div className="flex items-center gap-1">
            {/* Toggle Portrait Silhouette Guide */}
            {!capturedImage && !cameraError && (
              <button
                type="button"
                onClick={toggleGuide}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                  showGuide
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Bật/Tắt khung căn chỉnh nửa thân"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Khung căn</span>
              </button>
            )}

            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport - Portrait 3:4 for Half-body / Torso-up framing */}
        <div className="relative aspect-[3/4] w-full bg-black overflow-hidden flex items-center justify-center">
          {isFlashActive && <div className="absolute inset-0 bg-white z-30 transition-opacity duration-200" />}

          {capturedImage ? (
            <img src={capturedImage} alt="Snapshot" className="w-full h-full object-cover" />
          ) : cameraError ? (
            <div className="p-6 text-center text-slate-400">
              <p className="mb-4 text-amber-300 text-sm">{cameraError}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-xl transition inline-flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Chọn ảnh từ thiết bị
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* KHUNG CĂN CHỈNH NỬA THÂN TRÊN (HEAD & TORSO SILHOUETTE GUIDE) */}
              {showGuide && (
                <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-between p-4">
                  {/* Top Guide Text */}
                  <div className="bg-slate-950/75 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/30 text-[11px] font-medium text-amber-300 flex items-center gap-1 shadow-md">
                    <UserCheck className="w-3.5 h-3.5" /> Căn chỉnh: Đặt đầu & vai vào khung
                  </div>

                  {/* SVG Silhouette Overlay */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    <svg
                      viewBox="0 0 300 400"
                      className="w-full h-full max-h-[380px] text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]"
                    >
                      {/* Viewfinder 4 Corner Brackets */}
                      <path d="M 16 45 L 16 16 L 45 16" fill="none" stroke="currentColor" strokeWidth="2.5" />
                      <path d="M 284 45 L 284 16 L 255 16" fill="none" stroke="currentColor" strokeWidth="2.5" />
                      <path d="M 16 355 L 16 384 L 45 384" fill="none" stroke="currentColor" strokeWidth="2.5" />
                      <path d="M 284 355 L 284 384 L 255 384" fill="none" stroke="currentColor" strokeWidth="2.5" />

                      {/* Head Oval Silhouette */}
                      <ellipse
                        cx="150"
                        cy="110"
                        rx="46"
                        ry="58"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                      />

                      {/* Eye Level Guide Line */}
                      <line
                        x1="122"
                        y1="105"
                        x2="178"
                        y2="105"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        opacity="0.8"
                      />

                      {/* Neck & Torso Silhouette (từ giữa thân / ngực trở lên) */}
                      <path
                        d="M 132 165 C 132 180 122 190 95 205 C 55 225 35 260 26 384 L 274 384 C 265 260 245 225 205 205 C 178 190 168 180 168 165"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="7 5"
                      />

                      {/* Mid-Torso Reference Baseline */}
                      <line
                        x1="45"
                        y1="384"
                        x2="255"
                        y2="384"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="5 5"
                      />
                    </svg>

                    {/* Subtle eye level badge */}
                    <span className="absolute top-[28%] text-[10px] uppercase tracking-wider font-semibold text-amber-300/80 bg-slate-950/70 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Tầm mắt
                    </span>

                    {/* Subtle torso bottom badge */}
                    <span className="absolute bottom-2 text-[10px] uppercase tracking-wider font-semibold text-amber-300/80 bg-slate-950/70 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Giữa thân / Ngực
                    </span>
                  </div>

                  {/* Bottom hint */}
                  <div className="text-[10px] text-slate-400 bg-slate-950/60 backdrop-blur px-2.5 py-0.5 rounded-full">
                    Giữ tư thế này để mỗi ngày đều tề chỉnh đồng đều
                  </div>
                </div>
              )}
            </>
          )}

          {/* Hidden File Picker Fallback */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Controls Bar */}
        <div className="p-4 bg-slate-950 flex items-center justify-around border-t border-slate-800 z-20">
          {capturedImage ? (
            <>
              <button
                onClick={() => {
                  setCapturedImage(null);
                  startCamera();
                  sound.playPop();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition text-xs md:text-sm flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Chụp lại
              </button>
              <button
                onClick={confirmCapture}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs md:text-sm shadow-lg shadow-amber-500/25 hover:brightness-110 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Dùng ảnh này
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Chọn từ thư viện"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <button
                onClick={takeSnapshot}
                className="w-16 h-16 rounded-full bg-white border-4 border-slate-800 p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-xl"
                title="Bấm chụp ảnh"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-inner">
                  <Camera className="w-6 h-6 text-slate-950" />
                </div>
              </button>

              <button
                onClick={toggleFacingMode}
                className="p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Đổi camera trước/sau"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
