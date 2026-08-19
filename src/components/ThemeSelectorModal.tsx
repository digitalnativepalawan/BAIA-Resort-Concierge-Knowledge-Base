import React, { useRef, useState } from 'react';
import { RESORT_THEMES, ResortTheme, ResortThemeId } from '../data/themes';
import {
  Palette,
  Image as ImageIcon,
  Upload,
  Trash2,
  Check,
  X,
  Sparkles,
  Sun,
  Sliders
} from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedThemeId: ResortThemeId;
  onSelectTheme: (themeId: ResortThemeId) => void;
  customBgImage: string | null;
  onUploadCustomBg: (base64Image: string) => void;
  onRemoveCustomBg: () => void;
  bgDimLevel: number;
  onChangeBgDimLevel: (level: number) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedThemeId,
  onSelectTheme,
  customBgImage,
  onUploadCustomBg,
  onRemoveCustomBg,
  bgDimLevel,
  onChangeBgDimLevel,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadNotice('Please select an image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setUploadNotice('Image size is too large (max 12MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        onUploadCustomBg(base64);
        setUploadNotice('Custom background wallpaper applied!');
        setTimeout(() => setUploadNotice(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        id="theme-selector-modal"
        className="w-full max-w-xl bg-[#0a1226]/95 border border-white/15 rounded-3xl p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl relative overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#00f0ff]/10 border border-[#00f0ff]/25 text-[#00f0ff]">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-medium text-white tracking-tight">
                Theme of the Day & Wallpaper
              </h2>
              <p className="text-xs text-gray-400">
                Choose curated ambient lighting or upload your own resort photo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            title="Close theme picker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {uploadNotice && (
          <div className="mt-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>{uploadNotice}</span>
          </div>
        )}

        {/* Section 1: Themes of the Day */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Curated Day Themes</span>
            </h3>
            <span className="text-[11px] text-gray-400">5 Palawan Atmospheres</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {RESORT_THEMES.map((theme) => {
              const isSelected = selectedThemeId === theme.id && !customBgImage;
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    onSelectTheme(theme.id);
                    if (customBgImage) onRemoveCustomBg();
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all relative overflow-hidden group flex items-center gap-3 ${
                    isSelected
                      ? 'bg-white/10 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)] ring-1 ring-cyan-400'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.07]'
                  }`}
                >
                  {/* Theme Gradient swatch */}
                  <div
                    className="w-10 h-10 rounded-xl shrink-0 shadow-inner flex items-center justify-center border border-white/20"
                    style={{ background: theme.bgGradient }}
                  >
                    <div
                      className="w-4 h-4 rounded-full shadow-lg"
                      style={{ backgroundColor: theme.orbPrimary }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white truncate">{theme.name}</p>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1" />}
                    </div>
                    <p className="text-[10px] text-gray-400 truncate">{theme.timeOfDay}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Upload Custom Wallpaper from Device */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Custom Photo Wallpaper</span>
            </h3>
            {customBgImage && (
              <button
                onClick={onRemoveCustomBg}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove Custom Photo</span>
              </button>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
          />

          {customBgImage ? (
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-cyan-500/40 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={customBgImage}
                  alt="Custom Wallpaper Preview"
                  referrerPolicy="no-referrer"
                  className="w-16 h-12 rounded-xl object-cover border border-white/20 shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Custom Photo Active</span>
                  </p>
                  <p className="text-[11px] text-gray-400">Stored locally on this device</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white border border-white/20 transition-all"
                >
                  Change
                </button>
              </div>

              {/* Background Dim / Tint Slider for Readability */}
              <div className="pt-2 border-t border-white/10 space-y-1">
                <div className="flex justify-between text-[11px] text-gray-300">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-cyan-400" />
                    <span>Background Dim Level</span>
                  </span>
                  <span className="text-cyan-300">{Math.round(bgDimLevel * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.9"
                  step="0.05"
                  value={bgDimLevel}
                  onChange={(e) => onChangeBgDimLevel(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-5 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                  : 'border-white/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/30'
              }`}
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-cyan-300">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white">
                    Click or drag & drop a photo from your device
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Supports PNG, JPG, WebP (Villas, sunsets, beaches)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] active:scale-95"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
