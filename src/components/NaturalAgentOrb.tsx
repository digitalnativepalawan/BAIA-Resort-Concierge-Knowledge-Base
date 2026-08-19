import React, { useEffect, useRef } from 'react';
import { TalaState } from '../types';
import { ResortTheme } from '../data/themes';
import { Mic, Volume2, Sparkles, AlertCircle } from 'lucide-react';

interface NaturalAgentOrbProps {
  state: TalaState;
  onCoreClick: () => void;
  speechVolume?: number;
  isMicActive?: boolean;
  audioStream?: MediaStream | null;
  theme?: ResortTheme;
  subtitles?: string;
}

export const NaturalAgentOrb: React.FC<NaturalAgentOrbProps> = ({
  state,
  onCoreClick,
  speechVolume = 0.5,
  isMicActive,
  audioStream,
  theme,
  subtitles
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMicOn = isMicActive ?? (state === 'LISTENING' || state === 'SPEAKING' || state === 'PROCESSING');

  const primaryColor = theme?.orbPrimary || '#00f0ff';
  const secondaryColor = theme?.orbSecondary || '#3b82f6';
  const glowColor = theme?.orbGlow || 'rgba(0, 240, 255, 0.4)';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 340);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 340);

    // Audio stream analyzer setup
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let dataArray: Uint8Array | null = null;

    if (audioStream && audioStream.getAudioTracks().length > 0) {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          audioCtx = new AudioCtxClass();
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source = audioCtx.createMediaStreamSource(audioStream);
          source.connect(analyser);
          dataArray = new Uint8Array(analyser.frequencyBinCount);
        }
      } catch (e) {
        // Fallback gracefully
      }
    }

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    // Floating bioluminescent aura particles
    interface AuraParticle {
      x: number;
      y: number;
      baseRadius: number;
      angle: number;
      distance: number;
      speed: number;
      alpha: number;
      layer: number;
    }

    const particleCount = 28;
    const particles: AuraParticle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: width / 2,
        y: height / 2,
        baseRadius: Math.random() * 2.5 + 1.2,
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * 85 + 25,
        speed: (Math.random() * 0.012 + 0.004) * (Math.random() > 0.5 ? 1 : -1),
        alpha: Math.random() * 0.6 + 0.2,
        layer: Math.random() > 0.5 ? 1 : 2,
      });
    }

    let timeStep = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const centerX = width / 2;
      const centerY = height / 2;

      timeStep += 0.025;

      // Extract dynamic voice intensity
      let micIntensity = 0;
      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let k = 0; k < dataArray.length; k++) {
          sum += dataArray[k];
        }
        micIntensity = Math.min(1, sum / (dataArray.length * 128));
      }

      // Smooth state-based scale & pulse factors
      let statePulse = Math.sin(timeStep * 1.5) * 0.06;
      let waveAmp = 6;
      let coreColor = primaryColor;
      let outerGlowAlpha = 0.25;

      if (state === 'LISTENING') {
        statePulse = Math.sin(timeStep * 3.5) * 0.12 + micIntensity * 0.25;
        waveAmp = 12 + micIntensity * 18;
        outerGlowAlpha = 0.45;
      } else if (state === 'PROCESSING') {
        statePulse = Math.sin(timeStep * 5.0) * 0.1;
        waveAmp = 8;
        outerGlowAlpha = 0.35;
      } else if (state === 'SPEAKING') {
        statePulse = Math.sin(timeStep * 3.0) * 0.15 + speechVolume * 0.2;
        waveAmp = 14 + speechVolume * 16;
        outerGlowAlpha = 0.5;
      } else if (state === 'ERROR') {
        coreColor = '#f43f5e';
      }

      const baseRadius = Math.min(width, height) * 0.22;
      const currentRadius = baseRadius * (1 + statePulse);

      // 1. Soft Ambient Outer Bloom / Aurora Radial Glow
      const ambientGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        currentRadius * 0.4,
        centerX,
        centerY,
        currentRadius * 2.2
      );
      ambientGlow.addColorStop(0, glowColor);
      ambientGlow.addColorStop(0.5, 'rgba(0,0,0,0.08)');
      ambientGlow.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = ambientGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // 2. Harmonic Fluid Organic Ripple Waves
      const rippleCount = state === 'SPEAKING' || state === 'LISTENING' ? 4 : 2;
      for (let r = 0; r < rippleCount; r++) {
        const ripplePhase = (timeStep * 1.2 + r * 1.6) % (Math.PI * 2);
        const rippleRadius = currentRadius + (r + 1) * (18 + waveAmp * 0.5) * (0.8 + Math.sin(ripplePhase) * 0.2);
        const rippleAlpha = Math.max(0, (1 - (rippleRadius - currentRadius) / 90) * outerGlowAlpha);

        ctx.save();
        ctx.beginPath();
        const segments = 60;
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          const harmonic =
            Math.sin(theta * 3 + timeStep * 2 + r) * waveAmp * 0.35 +
            Math.cos(theta * 2 - timeStep * 1.5) * waveAmp * 0.25;
          const rad = rippleRadius + harmonic;
          const x = centerX + Math.cos(theta) * rad;
          const y = centerY + Math.sin(theta) * rad;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = r % 2 === 0 ? primaryColor : secondaryColor;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = rippleAlpha;
        ctx.shadowBlur = 12;
        ctx.shadowColor = primaryColor;
        ctx.stroke();
        ctx.restore();
      }

      // 3. Floating Bioluminescent Star Dust Particles
      particles.forEach((p) => {
        p.angle += p.speed * (state === 'LISTENING' || state === 'SPEAKING' ? 1.8 : 1.0);
        const dist = p.distance * (1 + statePulse * 0.5);
        const px = centerX + Math.cos(p.angle) * dist;
        const py = centerY + Math.sin(p.angle) * dist;

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, p.baseRadius * (1 + Math.sin(timeStep + p.distance) * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = p.layer === 1 ? primaryColor : secondaryColor;
        ctx.globalAlpha = p.alpha * (state === 'SPEAKING' ? 0.9 : 0.6);
        ctx.shadowBlur = 8;
        ctx.shadowColor = primaryColor;
        ctx.fill();
        ctx.restore();
      });

      // 4. Fluid Living Core Orb with Dynamic Gradient Shimmer
      const coreGrad = ctx.createRadialGradient(
        centerX - currentRadius * 0.3,
        centerY - currentRadius * 0.35,
        currentRadius * 0.05,
        centerX,
        centerY,
        currentRadius
      );
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, primaryColor);
      coreGrad.addColorStop(0.75, secondaryColor);
      coreGrad.addColorStop(1, 'rgba(10, 15, 30, 0.9)');

      ctx.save();
      ctx.beginPath();
      // Draw smooth undulating organic perimeter for the core
      const corePoints = 48;
      for (let i = 0; i <= corePoints; i++) {
        const theta = (i / corePoints) * Math.PI * 2;
        const fluidDistort =
          Math.sin(theta * 4 + timeStep * 2) * (waveAmp * 0.18) +
          Math.cos(theta * 3 - timeStep * 1.5) * (waveAmp * 0.12);
        const rad = currentRadius + fluidDistort;
        const x = centerX + Math.cos(theta) * rad;
        const y = centerY + Math.sin(theta) * rad;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = coreGrad;
      ctx.shadowBlur = 24;
      ctx.shadowColor = primaryColor;
      ctx.fill();

      // Core Highlight Glint
      const glintGrad = ctx.createRadialGradient(
        centerX - currentRadius * 0.35,
        centerY - currentRadius * 0.4,
        2,
        centerX - currentRadius * 0.35,
        centerY - currentRadius * 0.4,
        currentRadius * 0.55
      );
      glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      glintGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.15)');
      glintGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = glintGrad;
      ctx.beginPath();
      ctx.arc(
        centerX - currentRadius * 0.35,
        centerY - currentRadius * 0.4,
        currentRadius * 0.55,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, [state, speechVolume, audioStream, primaryColor, secondaryColor, glowColor]);

  const getStateText = () => {
    switch (state) {
      case 'LISTENING':
        return 'Listening to you...';
      case 'PROCESSING':
        return 'TALA is thinking...';
      case 'SPEAKING':
        return 'Speaking with you';
      case 'ERROR':
        return 'Tap to reconnect';
      default:
        return 'Tap orb or speak freely';
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Interactive Organic Orb Canvas Canvas Container */}
      <div
        onClick={onCoreClick}
        role="button"
        tabIndex={0}
        aria-label="Toggle voice conversation with TALA"
        className="relative w-64 h-64 sm:w-72 sm:h-72 cursor-pointer group flex items-center justify-center transition-transform duration-300 active:scale-95 focus:outline-none"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full pointer-events-none drop-shadow-[0_10px_25px_rgba(0,0,0,0.3)]"
        />

        {/* Center Minimal State Glyph on Hover or Mic Off */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-300">
          <div
            className={`p-3 rounded-full backdrop-blur-md border transition-all duration-300 ${
              state === 'LISTENING'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 scale-110 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                : state === 'SPEAKING'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 scale-105 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                : state === 'PROCESSING'
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 animate-spin shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                : 'bg-white/10 border-white/20 text-white/90 group-hover:bg-white/20 group-hover:scale-110 shadow-lg'
            }`}
          >
            {state === 'LISTENING' ? (
              <Mic className="w-5 h-5 animate-pulse" />
            ) : state === 'SPEAKING' ? (
              <Volume2 className="w-5 h-5 animate-pulse" />
            ) : state === 'PROCESSING' ? (
              <Sparkles className="w-5 h-5" />
            ) : state === 'ERROR' ? (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            ) : (
              <Mic className="w-5 h-5 opacity-80 group-hover:opacity-100" />
            )}
          </div>
        </div>
      </div>

      {/* Floating State Prompt & Natural Subtitle stream */}
      <div className="text-center mt-2 space-y-1.5 max-w-lg px-4">
        <p
          className="text-xs font-medium tracking-wide uppercase transition-all duration-300"
          style={{ color: primaryColor }}
        >
          {getStateText()}
        </p>

        {subtitles && (
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md shadow-lg animate-fadeIn max-w-md mx-auto">
            <p className="text-sm font-normal text-white/90 leading-relaxed italic">
              "{subtitles}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
