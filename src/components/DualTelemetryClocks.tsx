import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const DualTelemetryClocks: React.FC = () => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const utcDateString = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(now);

  const manilaTimeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now);

  const houstonTimeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now);

  return (
    <div className="bg-[#050b14]/70 border border-[#00f0ff]/20 rounded-xl px-3.5 py-1.5 backdrop-blur-md shadow-sm flex flex-col items-center gap-1 font-inter">
      {/* UTC Date */}
      <div className="flex items-center gap-1.5 text-[11px] font-normal tracking-wide text-cyan-200/90 border-b border-[#00f0ff]/15 pb-1 w-full justify-center">
        <Clock className="w-3 h-3 text-[#00f0ff]/80" />
        <span>UTC Date: <strong className="text-white font-medium tracking-wide tabular-nums">{utcDateString}</strong></span>
      </div>

      {/* Dual Timezone Clocks */}
      <div className="grid grid-cols-2 gap-3 w-full pt-0.5 divide-x divide-[#00f0ff]/20">
        {/* Manila Clock */}
        <div className="flex flex-col items-center px-1">
          <span className="text-[10px] font-medium tracking-wide text-cyan-300/80">
            Manila, PH (PHT)
          </span>
          <span className="text-xs sm:text-sm font-semibold text-white tracking-wider tabular-nums min-w-[105px] text-center mt-0.5">
            {manilaTimeStr}
          </span>
        </div>

        {/* Houston Clock */}
        <div className="flex flex-col items-center px-1">
          <span className="text-[10px] font-medium tracking-wide text-cyan-300/80">
            Houston, TX (CT)
          </span>
          <span className="text-xs sm:text-sm font-semibold text-white tracking-wider tabular-nums min-w-[105px] text-center mt-0.5">
            {houstonTimeStr}
          </span>
        </div>
      </div>
    </div>
  );
};
