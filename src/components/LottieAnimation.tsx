import { useEffect, useRef } from 'react'
import lottie, { type AnimationItem } from 'lottie-web/build/player/lottie_light'
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
  size,
  ariaLabel = 'Anatomia Healthcare Animation'
}: LottieAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<AnimationItem | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clean up previous instance if any
    if (animRef.current) {
      animRef.current.destroy()
    }

    try {
      animRef.current = lottie.loadAnimation({
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

      if (speed !== 1 && animRef.current) {
        animRef.current.setSpeed(speed)
      }
    } catch (err) {
      console.error('Failed to load Lottie animation:', err)
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy()
        animRef.current = null
      }
    }
  }, [animationData, loop, autoplay, speed])

  const style: React.CSSProperties = {}
  if (size) {
    style.width = typeof size === 'number' ? `${size}px` : size
    style.height = typeof size === 'number' ? `${size}px` : size
  }

  return (
    <div
      ref={containerRef}
      className={cn('inline-block overflow-hidden', className)}
      style={style}
      role="img"
      aria-label={ariaLabel}
    />
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
