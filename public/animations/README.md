# Anatomia Healthcare - Lottie Animations

This directory contains professional Lottie animations used throughout the Anatomia Healthcare platform.

## Available Animations

### 1. **success-checkmark.json**
- **Use Case:** Success messages, completed actions, confirmation dialogs
- **Duration:** 1.5 seconds
- **Loop:** No (plays once)
- **Colors:** Green (#33cc66)
- **Size:** ~2KB

### 2. **error-cross.json**
- **Use Case:** Error messages, failed actions, validation errors
- **Duration:** 1.5 seconds
- **Loop:** No (plays once)
- **Colors:** Red (#ef4351)
- **Size:** ~2KB

### 3. **heartbeat-loading.json**
- **Use Case:** Main loading screen, data fetching, page transitions
- **Duration:** 2 seconds
- **Loop:** Yes
- **Colors:** Red (#ef4351)
- **Size:** ~3KB

### 4. **medical-spinner.json**
- **Use Case:** Inline loading, button loading states, small loaders
- **Duration:** 2 seconds
- **Loop:** Yes
- **Colors:** Brand Blue (#3a91e5)
- **Size:** ~1.5KB

### 5. **empty-state-medical.json**
- **Use Case:** Empty states (no data), placeholder screens
- **Duration:** 3 seconds
- **Loop:** Yes
- **Colors:** Gray (#8c9db4)
- **Size:** ~2.5KB

## How to Use

### Option 1: Using PresetAnimation Component

```tsx
import { PresetAnimation } from '../components/ui'

// Success message
<PresetAnimation preset="success" size={150} loop={false} />

// Loading spinner
<PresetAnimation preset="spinner" size={100} />

// Empty state
<PresetAnimation preset="emptyState" size={200} />
```

### Option 2: Using LottieAnimation Component

```tsx
import { LottieAnimation } from '../components/ui'

<LottieAnimation
  animationData="/animations/heartbeat-loading.json"
  loop={true}
  autoplay={true}
  style={{ width: 200, height: 200 }}
/>
```

### Option 3: Direct lottie-web Usage

```tsx
import lottie from 'lottie-web'
import { useEffect, useRef } from 'react'

function MyComponent() {
  const containerRef = useRef(null)
  
  useEffect(() => {
    const animation = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/animations/success-checkmark.json'
    })
    
    return () => animation.destroy()
  }, [])
  
  return <div ref={containerRef} />
}
```

## Adding Custom Animations

1. **From LottieFiles.com:**
   - Search for medical/healthcare animations
   - Download JSON format
   - Place in this directory
   - Add to `AnimationPresets` in `LottieAnimation.tsx`

2. **From IconScout:**
   - Browse healthcare animation packs
   - Download Lottie JSON
   - Optimize if > 100KB
   - Add to project

3. **Custom Creation:**
   - Use Adobe After Effects + Bodymovin plugin
   - Or use Jitter.video for web-based creation
   - Export as Lottie JSON
   - Test performance

## Optimization Tips

- Keep animations under 100KB
- Use simple shapes over complex paths
- Limit layers to essential elements
- Test on mobile devices
- Consider using `dotLottie` format for smaller files

## Performance

All animations are:
- ✅ Optimized for web
- ✅ Responsive (SVG-based)
- ✅ GPU-accelerated
- ✅ Lightweight (< 5KB each)
- ✅ Mobile-friendly

## Resources

- **LottieFiles:** https://lottiefiles.com/search?q=medical
- **IconScout:** https://iconscout.com/lottie-animations/healthcare
- **Lottie Documentation:** https://airbnb.design/lottie/
- **After Effects Plugin:** https://aescripts.com/bodymovin/

## License

These animations are created specifically for Anatomia Healthcare and may contain elements from free/open-source Lottie libraries. For custom animations, please credit the original creators as required by their licenses.
