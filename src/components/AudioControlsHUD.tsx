import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Volume1,
  VolumeX,
  Gauge,
  RotateCcw,
  Play,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Headphones,
  Check
} from 'lucide-react';

interface AudioControlsHUDProps {
  volume: number; // 0.0 to 1.0
  onVolumeChange?: (newVolume: number) => void;
  speechRate: number; // 0.5 to 2.0
  onSpeechRateChange?: (newRate: number) => void;
  onTestVoice?: () => void;
  isSpeaking?: boolean;
}

const SPEED_PRESETS = [
  { label: '0.8x', value: 0.8, desc: 'Relaxed' },
  { label: '1.0x', value: 1.0, desc: 'Normal' },
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
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [prevNonZeroVolume, setPrevNonZeroVolume] = useState<number>(volume > 0 ? volume : 1.0);
  const [resetFeedback, setResetFeedback] = useState<boolean>(false);

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
    if (rate <= 0.8) return { label: `${rate.toFixed(2)}x Slow`, color: 'text-amber-300 border-amber-500/30 bg-amber-500/10' };
    if (rate < 1.15) return { label: `${rate.toFixed(2)}x Natural`, color: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10' };
    if (rate <= 1.4) return { label: `${rate.toFixed(2)}x Brisk`, color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' };
    return { label: `${rate.toFixed(2)}x Fast`, color: 'text-purple-300 border-purple-500/30 bg-purple-500/10' };
  };

  const rateInfo = getRateBadge(speechRate);

  return (
    <div
      id="tala-audio-hud-panel"
      className="w-full max-w-2xl bg-[#070e20]/95 border border-[#00f0ff]/30 rounded-2xl p-3.5 sm:p-4 backdrop-blur-xl shadow-[0_0_30px_rgba(0,240,255,0.12)] transition-all"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff]">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>Real-Time Voice Controls</span>
              </h3>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/25 text-[#00f0ff] text-[10px] font-mono">
                Live HUD
              </span>
            </div>
            <p className="text-[10px] font-mono text-gray-400">
              Adjust speech volume and rate in real-time
            </p>
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
              className="px-2.5 py-1 rounded-lg bg-[#00f0ff]/15 hover:bg-[#00f0ff]/25 text-[#00f0ff] border border-[#00f0ff]/40 text-[11px] font-mono font-bold transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
              title="Test current voice speed and volume"
            >
              <Play className="w-3 h-3 fill-[#00f0ff]" />
              <span className="hidden xs:inline">Test Voice</span>
            </button>
          )}

          <button
            type="button"
            id="btn-reset-audio-hud"
            onClick={handleResetDefaults}
            className={`px-2 py-1 rounded-lg border text-[11px] font-mono transition-all flex items-center gap-1 active:scale-95 ${
              resetFeedback
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-[#0a1228] text-gray-300 border-[#00f0ff]/20 hover:text-white hover:border-[#00f0ff]/40'
            }`}
            title="Reset volume to 100% and speech rate to 1.0x"
          >
            {resetFeedback ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px]">Reset</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3 h-3" />
                <span className="hidden xs:inline text-[10px]">1.0x / 100%</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-toggle-audio-hud-expand"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors"
            title={isExpanded ? 'Collapse Audio Sliders' : 'Expand Audio Sliders'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Slider Controls */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[#00f0ff]/15 space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Granular Volume Slider Block */}
            <div className="p-3 rounded-xl bg-[#0a1228]/90 border border-[#00f0ff]/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleMuteToggle}
                    className="p-1 rounded-md hover:bg-[#00f0ff]/10 text-[#00f0ff] transition-colors"
                    title={volume === 0 ? 'Unmute' : 'Mute'}
                  >
                    {volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="w-4 h-4 text-cyan-300" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-[#00f0ff]" />
                    )}
                  </button>
                  <span className="text-[11px] font-semibold text-gray-200 uppercase tracking-wider">
                    Volume
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    volume === 0
                      ? 'text-red-400 border-red-500/30 bg-red-500/10'
                      : 'text-[#00f0ff] border-[#00f0ff]/30 bg-[#00f0ff]/10'
                  }`}
                >
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
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00f0ff] focus:outline-none focus:ring-1 focus:ring-[#00f0ff]/50"
                  style={{
                    background: `linear-gradient(to right, #00f0ff 0%, #00f0ff ${volumePercent}%, #1e293b ${volumePercent}%, #1e293b 100%)`
                  }}
                />
                <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Granular Speech-Rate Slider Block */}
            <div className="p-3 rounded-xl bg-[#0a1228]/90 border border-[#00f0ff]/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span className="text-[11px] font-semibold text-gray-200 uppercase tracking-wider">
                    Speech Rate
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${rateInfo.color}`}>
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
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00f0ff] focus:outline-none focus:ring-1 focus:ring-[#00f0ff]/50"
                  style={{
                    background: `linear-gradient(to right, #00f0ff 0%, #00f0ff ${((speechRate - 0.5) / 1.5) * 100}%, #1e293b ${((speechRate - 0.5) / 1.5) * 100}%, #1e293b 100%)`
                  }}
                />
                <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                  <span>0.5x Slow</span>
                  <span>1.0x Normal</span>
                  <span>2.0x Fast</span>
                </div>
              </div>

              {/* Fast Rate Presets */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[9px] text-gray-400 uppercase">Presets:</span>
                {SPEED_PRESETS.map((preset) => {
                  const isSelected = Math.abs(speechRate - preset.value) < 0.03;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => onSpeechRateChange?.(preset.value)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                        isSelected
                          ? 'bg-[#00f0ff] text-slate-950 shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                          : 'bg-[#070e20] text-cyan-200/80 hover:text-white border border-[#00f0ff]/20 hover:border-[#00f0ff]/40'
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
