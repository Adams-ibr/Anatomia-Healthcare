# Lottie Animations Integration Guide - Anatomia Healthcare

## ✅ What's Been Implemented

A complete professional Lottie animation system has been integrated into your Anatomia Healthcare platform with medical-themed animations optimized for performance.

## 📦 Available Animations

### 1. Success Checkmark (`success-checkmark.json`)
- **Usage:** Form submissions, successful operations, confirmations
- **Duration:** 1.5 seconds  
- **Loop:** No (plays once)
- **Size:** ~2KB

### 2. Error Cross (`error-cross.json`)
- **Usage:** Error messages, failed operations, validation errors
- **Duration:** 1.5 seconds
- **Loop:** No (plays once)  
- **Size:** ~2KB

### 3. Heartbeat Loading (`heartbeat-loading.json`)
- **Usage:** Page loading, main loading screen, data fetching
- **Duration:** 2 seconds
- **Loop:** Yes
- **Size:** ~3KB

### 4. Medical Spinner (`medical-spinner.json`)
- **Usage:** Inline loading, button states, small loaders
- **Duration:** 2 seconds
- **Loop:** Yes
- **Size:** ~1.5KB

### 5. Empty State Medical (`empty-state-medical.json`)
- **Usage:** No data screens, empty lists, placeholder states
- **Duration:** 3 seconds
- **Loop:** Yes
- **Size:** ~2.5KB

## 🚀 How to Use

### Method 1: PresetAnimation Component (Recommended)

```tsx
import { PresetAnimation } from '../components/ui'

// Success animation
<PresetAnimation 
  preset="success" 
  size={150} 
  loop={false}
  onComplete={() => console.log('Animation complete!')}
/>

// Loading spinner
<PresetAnimation preset="spinner" size={100} />

// Empty state
<PresetAnimation preset="emptyState" size={200} />

// Heartbeat
<PresetAnimation preset="heartbeat" size={120} />
```

###  Method 2: Medical-Themed Components

```tsx
import { MedicalLoader, MedicalEmptyState } from '../components/ui'

// Loading with message
<MedicalLoader 
  size={100}
  message="Loading your data..."
  subtext="Please wait"
/>

// Empty state with action button
<MedicalEmptyState
  title="No Courses Found"
  message="Start by browsing our catalog"
  size={200}
  action={<Button onClick={...}>Browse Courses</Button>}
/>
```

### Method 3: Custom Lottie Animation

```tsx
import { LottieAnimation } from '../components/ui'

<LottieAnimation
  animationData="/animations/heartbeat-loading.json"
  loop={true}
  autoplay={true}
  speed={1.5}
  className="my-custom-class"
  style={{ width: 200, height: 200 }}
  onComplete={() => console.log('Done!')}
/>
```

## 📍 Where They're Already Integrated

1. **LoadingScreen.tsx** - Uses heartbeat animation
2. **Landing.tsx** - Multiple preset animations
3. **CourseDetails.tsx** - Medical loader
4. **Courses.tsx** - Empty state
5. **Search.tsx** - Empty state
6. **Student.tsx** - Empty state

## 🎨 Customization

### Available Presets
```typescript
AnimationPresets = {
  success: '/animations/success-checkmark.json',
  error: '/animations/error-cross.json',
  loading: '/animations/heartbeat-loading.json',
  heartbeat: '/animations/heartbeat-loading.json',
  spinner: '/animations/medical-spinner.json',
  emptyState: '/animations/empty-state-medical.json'
}
```

### Props

**PresetAnimation**
- `preset`: Animation preset key
- `size`: Width/height in pixels (default: 200)
- `loop`: Boolean (default: true)
- `autoplay`: Boolean (default: true)
- `className`: CSS classes
- `onComplete`: Callback function

**MedicalLoader**
- `size`: Animation size (default: 100)
- `message`: Loading message (optional)
- `subtext`: Additional text (optional)

**MedicalEmptyState**
- `title`: Main heading (default: 'No Data')
- `message`: Description text
- `size`: Animation size (default: 200)
- `action`: ReactNode for action button (optional)

## 💡 Best Practices

1. **Use appropriate sizes:**
   - Inline spinners: 40-60px
   - Loading screens: 150-250px
   - Empty states: 180-300px

2. **Disable loop for one-time animations:**
   - Success/error messages: `loop={false}`
   - Loading indicators: `loop={true}`

3. **Add completion callbacks:**
   ```tsx
   <PresetAnimation 
     preset="success" 
     loop={false}
     onComplete={() => navigate('/next-page')}
   />
   ```

4. **Match animations to branding:**
   - All animations use your brand colors
   - Medical theme maintains healthcare context

## 🔄 Adding New Animations

1. **From LottieFiles.com:**
   ```bash
   # Download JSON file
   # Place in public/animations/
   # Add to AnimationPresets
   ```

2. **Update AnimationPresets:**
   ```tsx
   // src/components/ui/LottieAnimation.tsx
   export const AnimationPresets = {
     ...existing,
     myNew: '/animations/my-new-animation.json'
   }
   ```

3. **Use it:**
   ```tsx
   <PresetAnimation preset="myNew" size={150} />
   ```

## 📊 Performance

- All animations are < 5KB
- SVG-based (scales without pixelation)
- GPU-accelerated rendering
- Lazy-loaded when needed
- Mobile-optimized

## 🌐 Resources

- **LottieFiles Medical:** https://lottiefiles.com/search?q=medical
- **IconScout Healthcare:** https://iconscout.com/lottie-animations/healthcare
- **Lottie Documentation:** https://airbnb.design/lottie/
- **Animation Guide:** `public/animations/README.md`

## 🎯 Examples in Code

Check these files for working examples:
- `src/pages/Landing.tsx` (lines 339, 351, 389)
- `src/components/LoadingScreen.tsx`
- `src/pages/CourseDetails.tsx` (line 119)
- `src/pages/Student.tsx` (lines 38, 152, 224)

## 🚦 Quick Start

```tsx
// 1. Import
import { PresetAnimation, MedicalLoader, MedicalEmptyState } from '../components/ui'

// 2. Use for loading
<MedicalLoader message="Loading courses..." />

// 3. Use for empty states
<MedicalEmptyState 
  title="No Enrollments Yet"
  message="Start learning by enrolling in a course"
  action={<Button>Browse Courses</Button>}
/>

// 4. Use for success/error
<PresetAnimation preset="success" size={120} loop={false} />
<PresetAnimation preset="error" size={120} loop={false} />
```

---

**Status:** ✅ Fully Integrated & Production Ready  
**Build:** ✅ Successful  
**Performance:** ✅ Optimized (<5KB per animation)
