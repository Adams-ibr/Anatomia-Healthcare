# Design Guidelines: Corporate Web Application

## Design Approach
**Reference-Based Approach**: Following the provided design screenshots with modern corporate aesthetic - clean, professional layouts with strong typography hierarchy and strategic use of whitespace.

## Typography System
- **Primary Font**: Modern sans-serif (Inter or similar via Google Fonts)
- **Hierarchy**: 
  - H1: text-5xl/text-6xl font-bold
  - H2: text-4xl font-semibold
  - H3: text-2xl font-semibold
  - Body: text-base/text-lg
  - Small: text-sm

## Layout & Spacing System
**Tailwind Spacing Units**: Primarily use 4, 6, 8, 12, 16, 20, 24, 32 for consistent rhythm
- Section padding: py-16 md:py-24
- Component spacing: gap-8 md:gap-12
- Container: max-w-7xl mx-auto px-6
- Card padding: p-6 md:p-8

## Navigation (Unique Navbar)
**Desktop**: Full-width transparent/solid header with centered or left-aligned logo, horizontal menu, CTA button
**Mobile**: Hamburger menu with slide-out/dropdown
**Sticky**: Fixed on scroll with subtle shadow
**Structure**: Logo + Nav Links + Search Icon + CTA Button

## Core Components

### Hero Section
- Full-width with large background image or gradient
- Centered content: H1 + supporting text + dual CTAs
- Height: min-h-[600px] on desktop
- Overlay: dark gradient for text readability
- CTA Buttons: backdrop-blur-sm bg-white/10 border-white/20

### Content Cards
- Clean white backgrounds with subtle shadows (shadow-lg)
- Rounded corners: rounded-xl
- Hover states: scale-105 transition-transform
- Image aspect ratio: aspect-video for thumbnails

### Forms (Contact, Search)
- Input fields: border-2 rounded-lg p-4
- Focus states: ring-2 ring-primary
- Labels: text-sm font-medium mb-2
- Submit buttons: full-width on mobile, auto on desktop

### Footer
- Multi-column layout (4 columns desktop, stack mobile)
- Sections: Company info, Quick links, Resources, Newsletter/Social
- Copyright bar at bottom
- Padding: py-12 md:py-16

## Page-Specific Guidelines

**Homepage**: Hero + Services grid (3 columns) + About preview + Featured content + CTA section
**About**: Hero banner + Company story + Team grid (3-4 columns) + Values/Mission
**Services**: Hero + Service cards grid (2-3 columns) with icons + Detailed descriptions
**Blog**: Hero + Featured post + Grid layout (3 columns) with images
**Single Blog**: Hero image + Article content (max-w-prose) + Sidebar (related posts)
**Career**: Hero + Open positions list + Company culture section
**Contact**: Split layout - Form (left) + Contact info/map (right)
**FAQ**: Accordion component with expand/collapse
**Search Results**: List view with thumbnails and excerpts
**404**: Centered content with illustration + navigation suggestions

## Images
- **Hero Images**: Use on Homepage, About, Services, Blog, Contact pages - full-width, high-quality, relevant to content
- **Blog Thumbnails**: Consistent aspect-video ratio
- **Team Photos**: Circular or rounded-square avatars
- **Service Icons**: Consistent size (w-12 h-12 or w-16 h-16)

## Interactions
- Smooth transitions: transition-all duration-300
- Hover states on all interactive elements
- Page transitions: fade-in on load
- Minimal animations: focus on micro-interactions only

## Accessibility
- Proper heading hierarchy on all pages
- ARIA labels for icon buttons
- Focus indicators on all interactive elements
- Sufficient color contrast ratios