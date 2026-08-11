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
    <div className="w-full flex-1 flex flex-col bg-[#0f1d3a]/80 border border-[#00f0ff]/20 rounded-2xl overflow-hidden backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] font-inter">
      {/* Stream Header */}
      <div className="px-4 py-3 bg-[#0a1228]/90 border-b border-[#00f0ff]/15 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[#00f0ff]">
          <Sparkles className="w-3.5 h-3.5 text-[#ff007f]" />
          <span className="font-medium tracking-wide">Communicator Thread</span>
        </div>
        <span className="text-gray-400 text-[11px] font-normal">{messages.length} Transmissions</span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[380px] scrollbar-thin scrollbar-thumb-[#00f0ff]/20">
        {messages.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-6 text-gray-400 text-xs">
            <div className="w-10 h-10 rounded-xl border border-[#00f0ff]/20 flex items-center justify-center mb-2 text-[#00f0ff]/70 bg-[#00f0ff]/5">
              <Bot className="w-5 h-5" />
            </div>
            <p className="text-[#00f0ff] font-medium mb-1">TALA Assistant Ready</p>
            <p className="max-w-xs text-gray-400 text-[11px] font-normal leading-relaxed">
              Tap the Arc Reactor core, click the microphone, or type a request below to get started.
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
                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-normal text-gray-400">
                  {isTala ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]" />
                      <span className="text-[#00f0ff] font-medium">TALA AI</span>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-300 font-medium">Guest Command</span>
                      <User className="w-3 h-3 text-[#ff007f]" />
                    </>
                  )}
                  <span className="text-gray-500 font-mono text-[10px]">[{msg.timestamp}]</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`relative max-w-[85%] sm:max-w-[78%] px-4 py-3 rounded-2xl text-xs sm:text-sm font-normal leading-relaxed shadow-md ${
                    isTala
                      ? 'bg-[#070e20]/95 border border-[#00f0ff]/25 text-gray-100 rounded-tl-none shadow-sm'
                      : 'bg-gradient-to-r from-[#ff007f]/20 to-[#8000ff]/20 border border-[#ff007f]/30 text-white rounded-tr-none'
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
                            className="text-[#00f0ff] underline font-medium hover:text-white transition-colors"
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
                    <div className="flex items-center justify-end gap-2 mt-2 pt-1.5 border-t border-[#00f0ff]/10 text-[11px] font-normal">
                      <button
                        onClick={() => onSpeakText(msg.text)}
                        title="Vocalize response"
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] transition-colors"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Speak</span>
                      </button>
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy text to clipboard"
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
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

