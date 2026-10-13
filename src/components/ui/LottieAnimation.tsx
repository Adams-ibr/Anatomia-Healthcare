import { useEffect, useRef } from 'react'
import lottie, { AnimationItem } from 'lottie-web'

interface LottieAnimationProps {
  animationData: object | string
  loop?: boolean
  autoplay?: boolean
  className?: string
  style?: React.CSSProperties
  speed?: number
  onComplete?: () => void
}

export function LottieAnimation({
  animationData,
  loop = true,
  autoplay = true,
  className = '',
  style,
  speed = 1,
  onComplete
}: LottieAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<AnimationItem | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Load animation data (either object or path)
    const loadAnimation = async () => {
      const data = typeof animationData === 'string'
        ? await fetch(animationData).then(res => res.json())
        : animationData

      animationRef.current = lottie.loadAnimation({
        container: containerRef.current!,
        renderer: 'svg',
        loop,
        autoplay,
        animationData: data
      })

      animationRef.current.setSpeed(speed)

      if (onComplete) {
        animationRef.current.addEventListener('complete', onComplete)
      }
    }

    loadAnimation()

    return () => {
      if (animationRef.current) {
        animationRef.current.destroy()
      }
    }
  }, [animationData, loop, autoplay, speed, onComplete])

  return <div ref={containerRef} className={className} style={style} />
}

// Preset animations for common use cases
export const AnimationPresets = {
  success: '/animations/success-checkmark.json',
  error: '/animations/error-cross.json',
  loading: '/animations/heartbeat-loading.json',
  heartbeat: '/animations/heartbeat-loading.json',
  spinner: '/animations/medical-spinner.json',
  emptyState: '/animations/empty-state-medical.json'
}

interface PresetAnimationProps {
  preset: keyof typeof AnimationPresets
  size?: number
  loop?: boolean
  autoplay?: boolean
  className?: string
  onComplete?: () => void
}

export function PresetAnimation({
  preset,
  size = 200,
  loop = true,
  autoplay = true,
  className = '',
  onComplete
}: PresetAnimationProps) {
  return (
    <LottieAnimation
      animationData={AnimationPresets[preset]}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={{ width: size, height: size }}
      onComplete={onComplete}
    />
  )
}

// Medical-themed preset components
export function MedicalLoader({ size = 100, message, subtext }: { size?: number; message?: string; subtext?: string }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <PresetAnimation preset="spinner" size={size} />
      {message && <p className="mt-3 text-sm font-medium text-ink">{message}</p>}
      {subtext && <p className="mt-1 text-xs text-muted">{subtext}</p>}
    </div>
  )
}

export function MedicalEmptyState({ 
  title = 'No Data',
  message = 'Nothing to show here yet',
  size = 200,
  action
}: { 
  title?: string
  message?: string
  size?: number
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <PresetAnimation preset="emptyState" size={size} />
      <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-muted">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
