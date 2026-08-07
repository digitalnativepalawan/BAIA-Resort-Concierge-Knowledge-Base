import React, { useEffect, useRef } from 'react';
import { TalaState, TelemetryLogEntry } from '../types';

interface TelemetryLogProps {
  logs: TelemetryLogEntry[];
  state: TalaState;
  hasServerKey: boolean;
  hasCustomKey: boolean;
  activeVoiceName?: string;
  speechVolume?: number;
  activeModelName?: string;
}

export const TelemetryLog: React.FC<TelemetryLogProps> = ({
  logs,
  state,
  hasServerKey,
  hasCustomKey,
  activeVoiceName,
  speechVolume = 0.5,
  activeModelName = 'openrouter/free'
}) => {
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getStateBadge = () => {
    switch (state) {
      case 'LISTENING':
        return <span className="text-[#ff007f] font-bold animate-pulse">[ LISTENING ]</span>;
      case 'PROCESSING':
        return <span className="text-[#00f0ff] font-bold animate-pulse">[ PROCESSING ]</span>;
      case 'SPEAKING':
        return <span className="text-[#00f0ff] font-bold animate-pulse">[ SPEAKING ]</span>;
      case 'ERROR':
        return <span className="text-red-400 font-bold">[ SYSTEM ALERT ]</span>;
      case 'IDLE':
      default:
        return <span className="text-[#00f0ff]/80 font-bold">[ TALA ONLINE ]</span>;
    }
  };

  return (
    <div className="w-full flex flex-col bg-[#080d1a]/80 border border-[#00f0ff]/20 rounded-xl p-3 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md">
      {/* Telemetry Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#00f0ff]/20 text-[11px] font-mono tracking-wider">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
          <span className="text-[#00f0ff] font-bold uppercase">TELEMETRY CONSOLE</span>
        </div>
        <div>{getStateBadge()}</div>
      </div>

      {/* Realtime Audio Waveform Visualizer */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-2 bg-[#050811]/90 rounded border border-[#00f0ff]/15">
        <span className="text-[10px] font-mono text-[#00f0ff]/60 uppercase">SIGNAL HARMONICS</span>
        <div className="flex items-end gap-1 h-5 w-32">
          {Array.from({ length: 16 }).map((_, i) => {
            const isSpeaking = state === 'SPEAKING';
            const isListening = state === 'LISTENING';
            const isProcessing = state === 'PROCESSING';

            let heightPercent = 15;
            if (isSpeaking) {
              heightPercent = Math.min(100, Math.max(20, (Math.sin(i + Date.now() / 150) + 1.2) * 40 * speechVolume));
            } else if (isListening) {
              heightPercent = Math.min(90, Math.max(15, (Math.cos(i * 0.8 + Date.now() / 200) + 1.1) * 35));
            } else if (isProcessing) {
              heightPercent = (i % 3 === 0) ? 75 : 30;
            }

            return (
              <div
                key={i}
                className="flex-1 rounded-t transition-all duration-100"
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: i % 2 === 0 ? '#00f0ff' : '#ff007f',
                  opacity: isSpeaking || isListening || isProcessing ? 0.9 : 0.25
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Quick Diagnostics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2 text-[10px] font-mono">
        <div className="px-2 py-1 bg-[#050811]/60 rounded border border-[#00f0ff]/10 text-[#00f0ff]/80">
          <span className="text-gray-400">VOICE:</span>{' '}
          <span className="truncate inline-block max-w-[90px] align-bottom">
            {activeVoiceName || 'Default Female'}
          </span>
        </div>
        <div className="px-2 py-1 bg-[#050811]/60 rounded border border-[#00f0ff]/10 text-[#00f0ff]/80">
          <span className="text-gray-400">API KEY:</span>{' '}
          {hasServerKey || hasCustomKey ? (
            <span className="text-emerald-400 font-bold">READY</span>
          ) : (
            <span className="text-amber-400 font-bold">NEEDS KEY</span>
          )}
        </div>
        <div className="px-2 py-1 bg-[#050811]/60 rounded border border-[#00f0ff]/10 text-[#00f0ff]/80 hidden sm:block truncate">
          <span className="text-gray-400">MODEL:</span>{' '}
          <span className="text-[#00f0ff]">{activeModelName.split('/').pop()}</span>
        </div>
      </div>

      {/* Scrolling Telemetry Log Area */}
      <div className="h-28 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-[#00f0ff]/30 text-[11px] font-mono">
        {logs.map((log) => (
          <div key={log.id} className="leading-tight flex items-start gap-1.5 opacity-90">
            <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
            <span
              className={
                log.type === 'error'
                  ? 'text-red-400 font-semibold'
                  : log.type === 'listening'
                  ? 'text-[#ff007f]'
                  : log.type === 'processing'
                  ? 'text-[#00f0ff]'
                  : log.type === 'speaking'
                  ? 'text-cyan-300'
                  : log.type === 'success'
                  ? 'text-emerald-400'
                  : 'text-gray-300'
              }
            >
              {log.message}
            </span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};
