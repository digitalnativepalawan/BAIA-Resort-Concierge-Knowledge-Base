import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { Volume2, Copy, Check, Sparkles, User, Bot } from 'lucide-react';

interface ConversationStreamProps {
  messages: ChatMessage[];
  onSpeakText: (text: string) => void;
  isSpeakingNow: boolean;
}

export const ConversationStream: React.FC<ConversationStreamProps> = ({
  messages,
  onSpeakText,
  isSpeakingNow
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#050811]/90 border border-[#00f0ff]/20 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.6)]">
      {/* Stream Header */}
      <div className="px-4 py-2.5 bg-[#080d1a] border-b border-[#00f0ff]/20 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-[#00f0ff]">
          <Sparkles className="w-3.5 h-3.5 text-[#ff007f]" />
          <span className="font-semibold uppercase tracking-wider">TACTICAL COMMUNICATOR THREAD</span>
        </div>
        <span className="text-gray-400 text-[10px]">{messages.length} TRANSMISSIONS</span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[380px] scrollbar-thin scrollbar-thumb-[#00f0ff]/30">
        {messages.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-gray-400 font-mono text-xs">
            <div className="w-12 h-12 rounded-full border border-[#00f0ff]/30 flex items-center justify-center mb-3 text-[#00f0ff]/60 bg-[#00f0ff]/5">
              <Bot className="w-6 h-6" />
            </div>
            <p className="text-[#00f0ff] font-semibold mb-1">[ TALA AI ONLINE ]</p>
            <p className="max-w-xs text-gray-400 text-[11px]">
              Tap the Arc Reactor core or click the microphone to initiate voice input, or type a query below.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isTala = msg.role === 'model';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isTala ? 'items-start' : 'items-end'} w-full animate-fadeIn`}
              >
                {/* Sender badge */}
                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-gray-400">
                  {isTala ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]" />
                      <span className="text-[#00f0ff] font-bold">TALA AI</span>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-300 font-semibold">USER COMMAND</span>
                      <User className="w-3 h-3 text-[#ff007f]" />
                    </>
                  )}
                  <span className="text-gray-500">[{msg.timestamp}]</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`relative max-w-[85%] sm:max-w-[78%] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-sans leading-relaxed shadow-lg ${
                    isTala
                      ? 'bg-[#0a1124] border border-[#00f0ff]/40 text-gray-100 rounded-tl-none shadow-[0_0_15px_rgba(0,240,255,0.08)]'
                      : 'bg-gradient-to-r from-[#ff007f]/20 to-[#8000ff]/20 border border-[#ff007f]/40 text-white rounded-tr-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {msg.text.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
                      if (/^https?:\/\//.test(part)) {
                        return (
                          <a
                            key={index}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00f0ff] underline font-mono font-bold hover:text-white transition-colors"
                          >
                            {part}
                          </a>
                        );
                      }
                      return part;
                    })}
                  </p>

                  {/* Message Action Controls */}
                  {isTala && (
                    <div className="flex items-center justify-end gap-2 mt-2 pt-1.5 border-t border-[#00f0ff]/15 text-[10px] font-mono">
                      <button
                        onClick={() => onSpeakText(msg.text)}
                        title="Vocalize this response"
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] transition-colors"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>SPEAK</span>
                      </button>
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy text to clipboard"
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">COPIED</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>COPY</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
