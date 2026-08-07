import React, { useState } from 'react';
import { Mic, MicOff, Send, Sparkles, Terminal, Square } from 'lucide-react';
import { TalaState } from '../types';

interface CommandBarProps {
  state: TalaState;
  onMicToggle: () => void;
  onSendPrompt: (prompt: string) => void;
  onStopSpeech: () => void;
  continuousListening: boolean;
  onToggleContinuousListening: () => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  state,
  onMicToggle,
  onSendPrompt,
  onStopSpeech,
  continuousListening,
  onToggleContinuousListening,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendPrompt(inputText.trim());
    setInputText('');
  };

  const quickPrompts = [
    "System Status Report",
    "Tactical Briefing",
    "Security Overview",
    "Who is TALA?",
    "Voice Diagnostic"
  ];

  const isListening = state === 'LISTENING';
  const isSpeaking = state === 'SPEAKING';
  const isProcessing = state === 'PROCESSING';

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* Quick Tactical Action Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
        <span className="text-gray-500 shrink-0 flex items-center gap-1 mr-1">
          <Terminal className="w-3 h-3 text-[#00f0ff]" />
          <span>TACTICS:</span>
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSendPrompt(prompt)}
            disabled={isProcessing}
            className="shrink-0 px-2.5 py-1 rounded-full bg-[#080d1a] hover:bg-[#00f0ff]/20 border border-[#00f0ff]/30 text-[#00f0ff] hover:border-[#00f0ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Primary Input Bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Voice Trigger Button */}
        <button
          type="button"
          onClick={onMicToggle}
          title={isListening ? "Stop Listening" : "Start Voice Input"}
          className={`relative p-3 rounded-xl border flex items-center justify-center transition-all shadow-lg shrink-0 ${
            isListening
              ? 'bg-[#ff007f] border-[#ff007f] text-white shadow-[0_0_20px_#ff007f] animate-pulse'
              : 'bg-[#080d1a] border-[#00f0ff]/50 text-[#00f0ff] hover:border-[#00f0ff] hover:bg-[#00f0ff]/10'
          }`}
        >
          {isListening ? (
            <MicOff className="w-5 h-5 animate-bounce" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Speech Interrupt Button (If Tala is speaking) */}
        {isSpeaking && (
          <button
            type="button"
            onClick={onStopSpeech}
            title="Stop Vocalization"
            className="px-3 py-3 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30 font-mono text-xs flex items-center gap-1.5 shrink-0 animate-pulse"
          >
            <Square className="w-4 h-4 fill-amber-300" />
            <span className="hidden sm:inline">MUTE VOCAL</span>
          </button>
        )}

        {/* Text Command Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening
                ? "Listening to voice input... or type command here"
                : "Type command for TALA or click mic..."
            }
            disabled={isProcessing}
            className="w-full px-4 py-3 bg-[#050811]/90 border border-[#00f0ff]/30 focus:border-[#00f0ff] rounded-xl text-xs sm:text-sm font-mono text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00f0ff] shadow-inner transition-colors"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="p-3 bg-gradient-to-r from-[#00f0ff] to-[#00a2ff] hover:from-[#00f0ff] hover:to-[#ff007f] disabled:from-gray-800 disabled:to-gray-800 text-slate-950 disabled:text-gray-500 font-bold rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.3)] active:scale-95"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Auto-Listen & Continuous Mode Toggle */}
      <div className="flex items-center justify-between px-1 text-[11px] font-mono text-gray-400">
        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={continuousListening}
            onChange={onToggleContinuousListening}
            className="w-3.5 h-3.5 rounded border-[#00f0ff] text-[#00f0ff] focus:ring-0 bg-[#050811] cursor-pointer"
          />
          <span className="group-hover:text-[#00f0ff] transition-colors flex items-center gap-1.5">
            <span>Auto-Listen Loop (Hands-Free Voice)</span>
            {continuousListening && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 animate-pulse font-bold">
                ● ACTIVE
              </span>
            )}
          </span>
        </label>
        <span className="text-[#00f0ff]/60 hidden sm:inline">VOICE ENGINE: WEB SPEECH API</span>
      </div>
    </div>
  );
};
