import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Volume1,
  VolumeX,
  Gauge,
  RotateCcw,
  Play,
  ChevronDown,
  ChevronUp,
  Sliders,
  Check
} from 'lucide-react';
import { ResortTheme } from '../data/themes';

interface AudioControlsHUDProps {
  volume: number; // 0.0 to 1.0
  onVolumeChange?: (newVolume: number) => void;
  speechRate: number; // 0.5 to 2.0
  onSpeechRateChange?: (newRate: number) => void;
  onTestVoice?: () => void;
  isSpeaking?: boolean;
  theme?: ResortTheme;
}

const SPEED_PRESETS = [
  { label: '0.8x', value: 0.8, desc: 'Relaxed' },
  { label: '1.0x', value: 1.0, desc: 'Natural' },
  { label: '1.25x', value: 1.25, desc: 'Brisk' },
  { label: '1.5x', value: 1.5, desc: 'Fast' },
];

export const AudioControlsHUD: React.FC<AudioControlsHUDProps> = ({
  volume = 1.0,
  onVolumeChange,
  speechRate = 1.0,
  onSpeechRateChange,
  onTestVoice,
  isSpeaking = false,
  theme,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [prevNonZeroVolume, setPrevNonZeroVolume] = useState<number>(volume > 0 ? volume : 1.0);
  const [resetFeedback, setResetFeedback] = useState<boolean>(false);

  const accentColor = theme?.accentColor || '#00f0ff';

  // Keep track of non-zero volume for unmute restoration
  useEffect(() => {
    if (volume > 0) {
      setPrevNonZeroVolume(volume);
    }
  }, [volume]);

  const volumePercent = Math.round(volume * 100);

  const handleMuteToggle = () => {
    if (volume > 0) {
      setPrevNonZeroVolume(volume);
      onVolumeChange?.(0);
    } else {
      onVolumeChange?.(prevNonZeroVolume || 1.0);
    }
  };

  const handleResetDefaults = () => {
    onVolumeChange?.(1.0);
    onSpeechRateChange?.(1.0);
    setResetFeedback(true);
    setTimeout(() => setResetFeedback(false), 1800);
  };

  // Determine rate tone label
  const getRateBadge = (rate: number) => {
    if (rate <= 0.8) return { label: `${rate.toFixed(2)}x Relaxed`, color: 'text-amber-300 border-amber-500/30 bg-amber-500/10' };
    if (rate < 1.15) return { label: `${rate.toFixed(2)}x Natural`, color: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10' };
    if (rate <= 1.4) return { label: `${rate.toFixed(2)}x Brisk`, color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' };
    return { label: `${rate.toFixed(2)}x Fast`, color: 'text-purple-300 border-purple-500/30 bg-purple-500/10' };
  };

  const rateInfo = getRateBadge(speechRate);

  return (
    <div
      id="tala-audio-hud-panel"
      className="w-full max-w-xl bg-black/40 border border-white/10 rounded-2xl p-3 sm:p-3.5 backdrop-blur-xl shadow-lg transition-all"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleMuteToggle}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 transition-colors"
            title={volume === 0 ? 'Unmute voice' : 'Mute voice'}
          >
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4 text-cyan-300" />
            ) : (
              <Volume2 className="w-4 h-4" style={{ color: accentColor }} />
            )}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white/90">
              Voice Audio
            </span>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              {volume === 0 ? 'Muted' : `${volumePercent}% • ${speechRate.toFixed(1)}x`}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onTestVoice && (
            <button
              type="button"
              id="btn-test-voice-sample"
              onClick={onTestVoice}
              disabled={isSpeaking}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 text-xs font-medium transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
              title="Test current voice speech"
            >
              <Play className="w-3 h-3 fill-current" />
              <span className="hidden xs:inline">Test Voice</span>
            </button>
          )}

          <button
            type="button"
            id="btn-reset-audio-hud"
            onClick={handleResetDefaults}
            className={`px-2 py-1 rounded-xl border text-xs font-medium transition-all flex items-center gap-1 active:scale-95 ${
              resetFeedback
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-white/5 text-gray-300 border-white/10 hover:text-white hover:bg-white/10'
            }`}
            title="Reset volume to 100% and rate to 1.0x"
          >
            {resetFeedback ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Reset</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3 h-3" />
                <span className="hidden xs:inline">Default</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-toggle-audio-hud-expand"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors flex items-center gap-1 text-xs"
            title={isExpanded ? 'Hide Sliders' : 'Fine Tune Audio'}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">{isExpanded ? 'Hide' : 'Sliders'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Slider Controls */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-3 text-xs animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Granular Volume Slider Block */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-300">
                  Volume Level
                </span>
                <span className="text-[11px] font-semibold text-white">
                  {volume === 0 ? 'Muted' : `${volumePercent}%`}
                </span>
              </div>

              {/* Slider Input with live gradient fill */}
              <div className="relative pt-1">
                <input
                  type="range"
                  id="hud-volume-slider"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer focus:outline-none"
                  style={{
                    accentColor: accentColor
                  }}
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>Mute</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Granular Speech-Rate Slider Block */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-300">
                  Speech Speed
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${rateInfo.color}`}>
                  {rateInfo.label}
                </span>
              </div>

              {/* Slider Input with live gradient fill */}
              <div className="relative pt-1">
                <input
                  type="range"
                  id="hud-speech-rate-slider"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={speechRate}
                  onChange={(e) => onSpeechRateChange?.(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer focus:outline-none"
                  style={{
                    accentColor: accentColor
                  }}
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>0.5x Slow</span>
                  <span>1.0x Natural</span>
                  <span>2.0x Fast</span>
                </div>
              </div>

              {/* Fast Rate Presets */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-gray-400">Presets:</span>
                {SPEED_PRESETS.map((preset) => {
                  const isSelected = Math.abs(speechRate - preset.value) < 0.03;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => onSpeechRateChange?.(preset.value)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                        isSelected
                          ? 'bg-white text-slate-900 shadow-md font-semibold'
                          : 'bg-white/5 text-gray-300 hover:text-white border border-white/10'
                      }`}
                      title={`Set speed to ${preset.label} (${preset.desc})`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
