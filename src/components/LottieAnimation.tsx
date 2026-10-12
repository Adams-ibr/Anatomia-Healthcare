import { useEffect, useRef, useState } from 'react'
import defaultAnimationData from '../assets/animations/anatomia-loader.json'
import { cn } from '../lib/utils'

export interface LottieAnimationProps {
  animationData?: any
  loop?: boolean
  autoplay?: boolean
  speed?: number
  className?: string
  size?: number | string
  ariaLabel?: string
}

export function LottieAnimation({
  animationData = defaultAnimationData,
  loop = true,
  autoplay = true,
  speed = 1,
  className,
  size = 140,
  ariaLabel = 'Anatomia Healthcare Vital Pulse Animation'
}: LottieAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [lottieLoaded, setLottieLoaded] = useState(false)

  useEffect(() => {
    let animItem: any = null
    let isMounted = true

    // Dynamically import lottie-web to ensure robust cross-environment execution
    import('lottie-web')
      .then((lottieModule) => {
        if (!isMounted || !containerRef.current) return

        const lottie = (lottieModule as any).default || lottieModule
        if (typeof lottie?.loadAnimation === 'function') {
          // Clear any children in container
          containerRef.current.innerHTML = ''

          animItem = lottie.loadAnimation({
            container: containerRef.current,
            renderer: 'svg',
            loop,
            autoplay,
            animationData,
            rendererSettings: {
              preserveAspectRatio: 'xMidYMid meet',
              progressiveLoad: true
            }
          })

          if (speed !== 1 && animItem) {
            animItem.setSpeed(speed)
          }

          setLottieLoaded(true)
        }
      })
      .catch((err) => {
        console.warn('Lottie dynamic loader fallback to vector engine:', err)
      })

    return () => {
      isMounted = false
      if (animItem && typeof animItem.destroy === 'function') {
        animItem.destroy()
      }
    }
  }, [animationData, loop, autoplay, speed])

  const dimension = typeof size === 'number' ? `${size}px` : size

  return (
    <div
      className={cn('relative inline-flex items-center justify-center overflow-hidden select-none', className)}
      style={{ width: dimension, height: dimension }}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Container for Lottie SVG instance */}
      <div
        ref={containerRef}
        className={cn('w-full h-full absolute inset-0 transition-opacity duration-300', lottieLoaded ? 'opacity-100 z-10' : 'opacity-0 z-0')}
      />

      {/* Pure Vector Clinical Animation Engine (Immediate 60fps display & zero-failure fallback) */}
      <svg
        viewBox="0 0 400 400"
        className={cn('w-full h-full transition-opacity duration-300', lottieLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100')}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>{`
            @keyframes pulseHeartbeat {
              0% { transform: scale(1); }
              12% { transform: scale(1.14); }
              22% { transform: scale(0.97); }
              34% { transform: scale(1.22); }
              48% { transform: scale(1); }
              100% { transform: scale(1); }
            }
            @keyframes ecgDash {
              0% { stroke-dashoffset: 420; }
              40% { stroke-dashoffset: 0; }
              85% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -420; }
            }
            @keyframes radarPulse1 {
              0% { transform: scale(0.5); opacity: 0; }
              20% { opacity: 0.5; }
              60% { transform: scale(1.35); opacity: 0; }
              100% { transform: scale(1.35); opacity: 0; }
            }
            @keyframes radarPulse2 {
              0% { transform: scale(0.5); opacity: 0; }
              30% { transform: scale(0.5); opacity: 0; }
              50% { opacity: 0.45; }
              85% { transform: scale(1.4); opacity: 0; }
              100% { transform: scale(1.4); opacity: 0; }
            }
            @keyframes orbitClockwise {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes orbitCounterClockwise {
              from { transform: rotate(360deg); }
              to { transform: rotate(0deg); }
            }
            .anim-heart {
              transform-origin: 200px 200px;
              animation: pulseHeartbeat 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
            }
            .anim-ecg {
              stroke-dasharray: 420;
              animation: ecgDash 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
            .anim-halo1 {
              transform-origin: 200px 200px;
              animation: radarPulse1 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
            }
            .anim-halo2 {
              transform-origin: 200px 200px;
              animation: radarPulse2 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
            }
            .anim-orbit1 {
              transform-origin: 200px 200px;
              animation: orbitClockwise 3.6s linear infinite;
            }
            .anim-orbit2 {
              transform-origin: 200px 200px;
              animation: orbitCounterClockwise 4.8s linear infinite;
            }
          `}</style>
          <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0284C7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Halo Ripples */}
        <circle cx="200" cy="200" r="105" fill="none" stroke="#0284C7" strokeWidth="2" className="anim-halo1" />
        <circle cx="200" cy="200" r="115" fill="none" stroke="#1B4E9B" strokeWidth="1.5" className="anim-halo2" />

        {/* Orbit Tracks */}
        <circle cx="200" cy="200" r="120" fill="none" stroke="#0284C7" strokeWidth="1.2" strokeOpacity="0.25" />
        <circle cx="200" cy="200" r="96" fill="none" stroke="#1B4E9B" strokeWidth="1.5" strokeDasharray="6 6" strokeOpacity="0.3" />

        {/* Orbiting Diagnostic Nodes */}
        <g className="anim-orbit1">
          <circle cx="320" cy="200" r="6" fill="#0284C7" />
          <circle cx="320" cy="200" r="9" fill="#0284C7" fillOpacity="0.2" />
        </g>
        <g className="anim-orbit2">
          <circle cx="200" cy="104" r="5" fill="#10B981" />
          <circle cx="200" cy="104" r="8" fill="#10B981" fillOpacity="0.25" />
        </g>

        {/* Central Soft Medical Shield Disc */}
        <circle cx="200" cy="200" r="60" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2" className="anim-heart" />

        {/* Medical Cross Core */}
        <g className="anim-heart">
          <rect x="173" y="191" width="54" height="18" rx="9" fill="#1B4E9B" />
          <rect x="191" y="173" width="18" height="54" rx="9" fill="#1B4E9B" />
        </g>

        {/* Dynamic Sinus Rhythm ECG Pulse Wave */}
        <path
          d="M 60 200 L 130 200 C 138 200 142 188 145 188 C 148 188 152 200 160 200 L 172 208 L 190 144 L 208 228 L 222 182 L 235 200 L 340 200"
          fill="none"
          stroke="#10B981"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="anim-ecg"
        />
      </svg>
    </div>
  )
}

/**
 * Pre-configured Medical Brand Loader for loading screens and async data states
 */
export function MedicalLoader({
  message = 'Loading anatomical curriculum...',
  subtext = 'Synchronizing clinical modules and models',
  className
}: {
  message?: string
  subtext?: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <LottieAnimation size={140} className="drop-shadow-sm" />
      <h4 className="mt-3 font-display text-base font-semibold text-ink">{message}</h4>
      {subtext && <p className="mt-1 text-xs text-muted max-w-xs">{subtext}</p>}
    </div>
  )
}

/**
 * Pre-configured Empty State with Ambient Medical Pulse
 */
export function MedicalEmptyState({
  title,
  message,
  action,
  className
}: {
  title: string
  message: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface/50 px-6 py-12 text-center', className)}>
      <LottieAnimation size={120} speed={0.8} />
      <h3 className="mt-2 font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export default LottieAnimation
