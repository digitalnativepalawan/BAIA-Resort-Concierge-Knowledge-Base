import React, { useEffect, useRef } from 'react';
import { TalaState } from '../types';

interface ArcReactorHUDProps {
  state: TalaState;
  onCoreClick: () => void;
  speechVolume?: number; // 0.0 to 1.0 speech audio volume simulation or actual boundary level
  interimTranscript?: string;
}

export const ArcReactorHUD: React.FC<ArcReactorHUDProps> = ({
  state,
  onCoreClick,
  speechVolume = 0.5,
  interimTranscript = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas particle dynamics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 360);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 360);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    // Particle definition
    interface Particle {
      x: number;
      y: number;
      radius: number;
      angle: number;
      distance: number;
      speed: number;
      color: string;
      alpha: number;
    }

    const particleCount = 40;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: width / 2,
        y: height / 2,
        radius: Math.random() * 2 + 1,
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * 120 + 30,
        speed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
        color: Math.random() > 0.3 ? '#00f0ff' : '#ff007f',
        alpha: Math.random() * 0.7 + 0.3
      });
    }

    let globalRotation = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const centerX = width / 2;
      const centerY = height / 2;

      // Speed multiplier based on TALA state
      let speedMult = 1;
      let particlePulse = 1;

      if (state === 'LISTENING') {
        speedMult = 3.5;
        particlePulse = 1.6;
      } else if (state === 'PROCESSING') {
        speedMult = 5.0;
        particlePulse = 2.0;
      } else if (state === 'SPEAKING') {
        speedMult = 2.0 + speechVolume * 3.0;
        particlePulse = 1.2 + speechVolume * 1.5;
      } else if (state === 'ERROR') {
        speedMult = 0.5;
      }

      globalRotation += 0.01 * speedMult;

      // Draw particle dust orbiting the reactor
      particles.forEach((p) => {
        p.angle += p.speed * speedMult;
        const currentDist = p.distance * (state === 'SPEAKING' ? 1 + speechVolume * 0.3 : 1);
        const px = centerX + Math.cos(p.angle) * currentDist;
        const py = centerY + Math.sin(p.angle) * currentDist;

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, p.radius * particlePulse, 0, Math.PI * 2);
        ctx.fillStyle = state === 'ERROR' ? '#ff3366' : p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 10;
        ctx.shadowColor = state === 'ERROR' ? '#ff3366' : p.color;
        ctx.fill();
        ctx.restore();
      });

      // Draw faint energy connector arcs when processing or listening
      if (state === 'PROCESSING' || state === 'LISTENING' || state === 'SPEAKING') {
        ctx.save();
        ctx.strokeStyle = state === 'PROCESSING' ? '#ff007f' : '#00f0ff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.25;
        for (let i = 0; i < 6; i++) {
          const a = globalRotation + (i * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(centerX + Math.cos(a) * 110, centerY + Math.sin(a) * 110);
          ctx.stroke();
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, speechVolume]);

  // Derived state styles for SVG Arc Reactor rings
  const getOuterRingClass = () => {
    switch (state) {
      case 'LISTENING':
        return 'animate-[spin_3s_linear_infinite] stroke-[#00f0ff] drop-shadow-[0_0_15px_#00f0ff]';
      case 'PROCESSING':
        return 'animate-[spin_1.5s_linear_infinite] stroke-[#ff007f] drop-shadow-[0_0_20px_#ff007f]';
      case 'SPEAKING':
        return 'animate-[spin_4s_linear_infinite] stroke-[#00f0ff] drop-shadow-[0_0_18px_#00f0ff]';
      case 'ERROR':
        return 'stroke-[#ff3366] drop-shadow-[0_0_15px_#ff3366]';
      case 'IDLE':
      default:
        return 'animate-[spin_12s_linear_infinite] stroke-[#00f0ff]/80 drop-shadow-[0_0_8px_#00f0ff]';
    }
  };

  const getInnerRingClass = () => {
    switch (state) {
      case 'LISTENING':
        return 'animate-[spin_2s_linear_infinite_reverse] stroke-[#ff007f]';
      case 'PROCESSING':
        return 'animate-[spin_0.8s_linear_infinite_reverse] stroke-[#00f0ff]';
      case 'SPEAKING':
        return 'animate-[spin_3s_linear_infinite_reverse] stroke-[#ff007f]';
      case 'ERROR':
        return 'stroke-[#ff3366]';
      case 'IDLE':
      default:
        return 'animate-[spin_8s_linear_infinite_reverse] stroke-[#00f0ff]/60';
    }
  };

  const getCoreGlowClass = () => {
    switch (state) {
      case 'LISTENING':
        return 'from-[#00f0ff] via-[#00f0ff]/80 to-[#ff007f] animate-pulse drop-shadow-[0_0_35px_#00f0ff]';
      case 'PROCESSING':
        return 'from-[#ff007f] via-[#00f0ff]/90 to-[#ff007f] animate-ping drop-shadow-[0_0_40px_#ff007f]';
      case 'SPEAKING':
        return 'from-[#00f0ff] via-[#00f0ff] to-[#00f0ff]/60 drop-shadow-[0_0_30px_#00f0ff]';
      case 'ERROR':
        return 'from-[#ff3366] via-[#ff3366]/80 to-[#990022] drop-shadow-[0_0_25px_#ff3366]';
      case 'IDLE':
      default:
        return 'from-[#00f0ff] via-[#00f0ff]/50 to-transparent drop-shadow-[0_0_15px_#00f0ff]';
    }
  };

  // Dynamic scale calculation for speaking pulse
  const scaleValue = state === 'SPEAKING'
    ? 1 + speechVolume * 0.25
    : state === 'LISTENING'
    ? 1.08
    : state === 'PROCESSING'
    ? 1.12
    : 1.0;

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-md my-4 select-none">
      {/* Container aspect wrapper */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center">
        
        {/* Background Canvas for orbiting ambient plasma dust */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />

        {/* Outer Sci-Fi Ring Frame */}
        <div
          className="absolute inset-0 rounded-full border border-[#00f0ff]/20 bg-[#0a1228]/80 backdrop-blur-md shadow-[0_0_50px_rgba(0,240,255,0.08)] transition-all duration-500"
          style={{ transform: `scale(${scaleValue})` }}
        />

        {/* SVG Arc-Reactor Precision HUD Rings */}
        <svg
          viewBox="0 0 240 240"
          className="absolute inset-0 w-full h-full z-10 transition-transform duration-300"
          style={{ transform: `scale(${scaleValue})` }}
        >
          <defs>
            <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#ff007f" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Segmented Precision Ring */}
          <circle
            cx="120"
            cy="120"
            r="108"
            fill="none"
            strokeDasharray="18 8 36 8 8 8"
            strokeWidth="1.5"
            className={`${getOuterRingClass()} origin-center transition-all duration-300`}
          />

          {/* Thin Outer Fine Guide Ring */}
          <circle
            cx="120"
            cy="120"
            r="102"
            fill="none"
            stroke="#00f0ff"
            strokeOpacity="0.15"
            strokeWidth="0.75"
          />

          {/* Middle Precision Tick Ring */}
          <circle
            cx="120"
            cy="120"
            r="92"
            fill="none"
            stroke="#00f0ff"
            strokeOpacity="0.2"
            strokeWidth="0.75"
            strokeDasharray="3 3"
          />

          {/* Counter Rotating Inner Ring with Fine Notch Marks */}
          <circle
            cx="120"
            cy="120"
            r="78"
            fill="none"
            strokeDasharray="30 10 12 10"
            strokeWidth="1.75"
            className={`${getInnerRingClass()} origin-center transition-all duration-300`}
          />

          {/* Innermost Precision Core Orbit Ring */}
          <circle
            cx="120"
            cy="120"
            r="68"
            fill="none"
            stroke="#00f0ff"
            strokeOpacity="0.12"
            strokeWidth="0.75"
          />

          {/* Node Markers on HUD */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 120 + Math.cos(rad) * 92;
            const y = 120 + Math.sin(rad) * 92;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="2.2"
                fill={state === 'PROCESSING' ? '#ff007f' : '#00f0ff'}
                className="transition-colors duration-300"
              />
            );
          })}

          {/* Target Reticle Crosshairs */}
          <line x1="120" y1="18" x2="120" y2="30" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="120" y1="210" x2="120" y2="222" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="18" y1="120" x2="30" y2="120" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="210" y1="120" x2="222" y2="120" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.5" />
        </svg>

        {/* Interactive Arc Reactor Core Trigger */}
        <button
          id="arc-reactor-trigger"
          onClick={onCoreClick}
          title="Click to toggle Voice Command listening"
          className="relative z-20 w-32 h-32 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#00f0ff] transition-transform active:scale-95"
        >
          {/* Glowing Inner Core Sphere */}
          <div
            className={`absolute inset-2 rounded-full bg-gradient-to-br ${getCoreGlowClass()} opacity-90 transition-all duration-500`}
          />

          {/* Glass Lens Overlay with Sci-Fi Grid Lines */}
          <div className="absolute inset-0 rounded-full border-2 border-[#00f0ff]/60 group-hover:border-[#00f0ff] bg-[#070e20]/60 backdrop-blur-sm flex items-center justify-center shadow-inner transition-all duration-300">
            
            {/* Core Symbol / State Display */}
            <div className="flex flex-col items-center justify-center text-center p-2 z-30">
              <span className="text-[10px] font-inter tracking-wider text-[#00f0ff] opacity-90 mb-0.5 font-medium">
                {state === 'IDLE' && 'Standby'}
                {state === 'LISTENING' && 'Listening...'}
                {state === 'PROCESSING' && 'Thinking...'}
                {state === 'SPEAKING' && 'Speaking...'}
                {state === 'ERROR' && 'Alert'}
              </span>

              {/* Central Core Icon or Status Indicator */}
              <div className="w-8 h-8 my-1 flex items-center justify-center">
                {state === 'LISTENING' ? (
                  <div className="w-5 h-5 rounded-full bg-[#ff007f] animate-ping" />
                ) : state === 'PROCESSING' ? (
                  <div className="w-5 h-5 border-2 border-t-transparent border-[#00f0ff] rounded-full animate-spin" />
                ) : state === 'SPEAKING' ? (
                  <div className="flex items-center gap-1 h-5">
                    <span className="w-1 bg-[#00f0ff] animate-[bounce_0.6s_infinite_100ms]" style={{ height: `${20 + speechVolume * 80}%` }} />
                    <span className="w-1 bg-[#00f0ff] animate-[bounce_0.6s_infinite_200ms]" style={{ height: `${40 + speechVolume * 60}%` }} />
                    <span className="w-1 bg-[#ff007f] animate-[bounce_0.6s_infinite_300ms]" style={{ height: `${30 + speechVolume * 70}%` }} />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-[#00f0ff] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff] animate-pulse" />
                  </div>
                )}
              </div>

              <span className="text-[11px] font-inter font-bold text-[#00f0ff] group-hover:text-white tracking-wide uppercase">
                {state === 'LISTENING' ? 'Speak Now' : 'Wake up TALA'}
              </span>
            </div>
          </div>
        </button>

        {/* Orbiting HUD Status Tags */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-[#0f1d3a]/95 border border-[#00f0ff]/40 backdrop-blur-md shadow-lg text-xs font-inter text-cyan-200 font-semibold tracking-wide whitespace-nowrap flex items-center gap-2">
          {state === 'IDLE' && (
            <>
              <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
              <span>Wake up TALA • Ready</span>
            </>
          )}
          {state === 'LISTENING' && (
            <>
              <span className="w-2 h-2 rounded-full bg-[#ff007f] animate-ping" />
              <span>TALA Listening...</span>
            </>
          )}
          {state === 'PROCESSING' && (
            <>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-spin" />
              <span>TALA Thinking...</span>
            </>
          )}
          {state === 'SPEAKING' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
              <span>TALA Speaking...</span>
            </>
          )}
          {state === 'ERROR' && (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>TALA System Alert</span>
            </>
          )}
        </div>
      </div>

      {/* Real-time Interim Voice Transcript Display during listening */}
      {state === 'LISTENING' && interimTranscript && (
        <div className="mt-4 px-4 py-2 rounded-lg bg-[#070e20]/90 border border-[#00f0ff]/50 text-xs font-mono text-[#00f0ff] max-w-sm text-center animate-pulse shadow-[0_0_20px_rgba(0,240,255,0.15)]">
          <span className="text-[#ff007f] font-bold mr-1">[HEARING]:</span> "{interimTranscript}"
        </div>
      )}
    </div>
  );
};
