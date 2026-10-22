'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, Image as ImageIcon } from 'lucide-react';
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
          height: { ideal: 720 },
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

  const takeSnapshot = () => {
    if (!videoRef.current) return;

    sound.playShutter();
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        // Mirror selfie camera
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="font-semibold text-slate-100 text-lg">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
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
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
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
        <div className="p-5 bg-slate-950 flex items-center justify-around border-t border-slate-800">
          {capturedImage ? (
            <>
              <button
                onClick={() => {
                  setCapturedImage(null);
                  startCamera();
                  sound.playPop();
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Chụp lại
              </button>
              <button
                onClick={confirmCapture}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold shadow-lg shadow-amber-500/25 hover:brightness-110 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Xác nhận dùng ảnh
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Chọn từ thư viện"
              >
                <ImageIcon className="w-6 h-6" />
              </button>

              <button
                onClick={takeSnapshot}
                className="w-16 h-16 rounded-full bg-white border-4 border-slate-800 p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-xl"
                title="Chụp ảnh"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-slate-950" />
                </div>
              </button>

              <button
                onClick={toggleFacingMode}
                className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Đổi camera trước/sau"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
