import React, { useState } from 'react';
import { Mic, MicOff, Send, HelpCircle, Square } from 'lucide-react';
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
    "Do you have vegan food?",
    "How to get there from El Nido?",
    "Can I rent a motorbike?",
    "What island tours do you offer?",
    "What are check-in times?",
    "Who is TALA?"
  ];

  const isListening = state === 'LISTENING';
  const isSpeaking = state === 'SPEAKING';
  const isProcessing = state === 'PROCESSING';

  return (
    <div className="w-full flex flex-col gap-3 font-inter">
      {/* Quick Tactical Action Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-gray-400 shrink-0 flex items-center gap-1.5 mr-1 text-xs font-medium">
          <HelpCircle className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span>Guest FAQs:</span>
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSendPrompt(prompt)}
            disabled={isProcessing}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-[#0d1b2b]/60 hover:bg-[#00f0ff]/15 border border-[#00f0ff]/20 text-cyan-200 hover:text-white transition-all text-xs font-normal disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Primary Input Bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
        {/* Voice Trigger Button with Wake Up TALA Label */}
        <button
          type="button"
          onClick={onMicToggle}
          title={isListening ? "Stop Listening" : "Wake Up TALA"}
          className={`relative px-3 py-2.5 rounded-xl border flex items-center gap-2 transition-all shrink-0 font-medium text-xs ${
            isListening
              ? 'bg-[#ff007f] border-[#ff007f] text-white shadow-[0_0_15px_rgba(255,0,127,0.5)] animate-pulse'
              : 'bg-[#00f0ff]/15 border-[#00f0ff]/50 text-[#00f0ff] hover:bg-[#00f0ff]/25 hover:border-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.2)]'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4 animate-bounce text-white" />
              <span>Listening...</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-[#00f0ff] animate-pulse" />
              <span className="font-semibold text-white tracking-wide">Wake up TALA</span>
            </>
          )}
        </button>

        {/* Speech Interrupt Button (If Tala is speaking) */}
        {isSpeaking && (
          <button
            type="button"
            onClick={onStopSpeech}
            title="Stop Vocalization"
            className="px-3 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-medium flex items-center gap-1.5 shrink-0 animate-pulse"
          >
            <Square className="w-3.5 h-3.5 fill-amber-300" />
            <span className="hidden sm:inline">Mute Vocal</span>
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
            className="w-full px-4 py-2.5 bg-[#070e20]/90 border border-[#00f0ff]/20 focus:border-[#00f0ff]/50 rounded-xl text-xs sm:text-sm font-inter text-gray-100 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-[#00f0ff]/30 backdrop-blur-md transition-colors"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="p-2.5 bg-gradient-to-r from-[#00f0ff] to-[#00a2ff] hover:from-[#00f0ff] hover:to-[#ff007f] disabled:from-gray-800 disabled:to-gray-800 text-slate-950 disabled:text-gray-500 font-medium rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-95 shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Hands-Free Voice Status */}
      <div className="flex items-center justify-between px-1 text-[11px] font-inter font-normal text-gray-400">
        <button
          type="button"
          onClick={onToggleContinuousListening}
          className="flex items-center gap-2 hover:text-cyan-200 transition-colors select-none group focus:outline-none"
        >
          <span className={`w-2 h-2 rounded-full ${continuousListening ? 'bg-[#00f0ff] animate-ping' : 'bg-gray-500'}`} />
          <span className="flex items-center gap-1.5 font-medium">
            <span className={continuousListening ? 'text-cyan-100' : 'text-gray-400'}>Hands-Free Voice Conversation</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${
              continuousListening
                ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}>
              {continuousListening ? 'ACTIVE' : 'PAUSED (CLICK TO ENABLE)'}
            </span>
          </span>
        </button>
        <span className="text-gray-400/80 font-light hidden sm:inline">Voice Engine: Web Speech API</span>
      </div>
    </div>
  );
};

