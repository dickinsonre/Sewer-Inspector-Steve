# SWMMCRAFT Ultimate - Design Guidelines

## Design Approach
**Reference-Based: Minecraft-Inspired Professional Engineering Tool**

SWMMCRAFT Ultimate combines retro Minecraft aesthetics with serious hydraulic modeling functionality. The design brings playful, nostalgic gaming visuals to a technical utility application, making complex stormwater management approachable and engaging.

**Core Philosophy:** Pixel-perfect retro gaming aesthetic meets professional engineering software.

---

## Typography System

### Font Families
- **Primary UI/Headers:** 'Press Start 2P' (pixel font for buttons, labels, titles)
- **Body/Data:** 'VT323' (monospace for inputs, stats, technical readouts)

### Hierarchy
- **Logo/Branding:** 14px Press Start 2P
- **Panel Titles:** 9px Press Start 2P
- **Button Text:** 7-8px Press Start 2P
- **Form Labels:** 7px Press Start 2P
- **Body/Values:** 13-14px VT323
- **Stats/Numbers:** 11-14px VT323

---

## Layout System

### Spacing Primitives
Use Tailwind-equivalent spacing units: **2, 4, 6, 8, 10, 12, 16**
- Tight spacing: 2-4 units (form elements, button gaps)
- Standard spacing: 6-8 units (panel padding, margins)
- Generous spacing: 10-16 units (section separation)

### Grid Structure
- **Fixed Sidebar:** 280px right panel for controls
- **Fixed Toolbar:** 54px left toolbar for tools
- **Header:** Fixed height with flex wrapping for responsive controls
- **Canvas:** Flexible fill remaining space
- **Minimap:** 140px × 140px fixed overlay (top-right)

---

## Component Library

### Buttons (Minecraft Stone Style)
- **3D border effect:** Light top/left borders (#fff), dark bottom/right (#373737)
- **Gradient backgrounds:** Lighter top to darker bottom
- **States:**
  - Default: Gray stone gradient
  - Hover: Slightly lighter gradient
  - Active: Inverted border (pressed effect)
  - Primary: Blue gradient (#4A90D9 → #2E5A87)
  - Success/Active: Green gradient (#5D9E3C → #3D6E2C)
  - Danger: Red gradient (#CC4444 → #993333)

### Panels
- **Background:** Linear gradient (#c6c6c6 → #8b8b8b)
- **Border:** 3D inset/outset effect (white/dark gray)
- **Margin:** 8px from container edges
- **Padding:** 10px internal

### Form Inputs
- **Black background** with green terminal text (#5D9E3C on #000)
- **2px inset border** (#444)
- **Monospace font** (VT323) for data entry

### Icons & Visual Elements
- **Emoji-based icons** for toolbar buttons (authentic retro feel)
- **Pixel art characters** for game elements (Steve character)
- **2D canvas elements** with blocky, geometric shapes

### Tooltips
- Panel-style background with 3D borders
- 9px Press Start 2P headers
- Max-width: 240px
- Fade-in transition: 0.15s

### Modals
- **Dark overlay:** rgba(0,0,0,0.85)
- **Panel-style container:** 4px solid border, gradient background
- **Max-width:** 500px, responsive width
- **Actions:** Right-aligned button row with 8px gap

---

## Color Palette

### Core Brand Colors
- **Grass Green:** #5D9E3C (primary accent, success states)
- **Water Blue:** #3B9AE1 (secondary accent)
- **Stone Gray:** #7A7A7A (neutral UI)
- **Dirt Brown:** #8B6914 (earth tones)
- **Gold:** #FFD700 (highlights)

### UI Backgrounds
- **Day Sky:** Linear gradient #7EC8E3 → #A8E6CF
- **Night Sky:** Linear gradient #0D1B2A → #1B2838
- **Dark Panels:** #1a1a1a to #3d3d3d gradients
- **Canvas/Inputs:** Pure black #000

### Status Colors
- **Warning/Alert:** #FF4444 with pulse animation
- **Success:** #5D9E3C
- **Info Text:** #888 (muted)

---

## Special Features

### Day/Night Mode
- Toggle switches entire background gradient
- Night mode reveals animated star field
- Maintains same UI contrast in both modes

### Audio Visual Feedback
- **Audio indicator:** Bottom-right with animated bars
- **Muted state:** Gray bars, no animation
- Bars: 4px wide, 20px tall, staggered animation

### Character (Steve)
- **Full pixel art** with animated walking (leg/arm swing)
- **Speech bubbles** for inspections
- **Shadow beneath** character
- **Minimap presence** as cyan dot
- **Idle bobbing** animation when stationary

### Canvas Rendering
- **Grid overlay** toggle
- **Zoom controls** with + / - buttons
- **2D/3D isometric** view switching
- **Minimap** synchronized with main view
- **Status bar** bottom-left showing coordinates/mode

### Profile View
- **Bottom overlay:** 180px height, black background
- **4px green border** top (#5D9E3C)
- **Collapsible** toggle state
- **Chart canvas** for profile visualization

---

## Interaction Patterns

### Tool Selection
- **Keyboard shortcuts** displayed in tooltips (V, H, J, O, S, C, A, R, Del)
- **Active state** highlighted with green gradient
- **Hover tooltips** positioned right of toolbar

### Context Menus
- **Right-click activation** on canvas elements
- **Panel-style** appearance matching UI
- **Danger items** in red (#CC0000)

### Undo/Redo System
- **Visual indicator** top-left showing undo stack count
- **Keyboard shortcuts** supported
- **Button states** in header

---

## Accessibility

- **Keyboard navigation** for all tools
- **High contrast** text on dark backgrounds
- **Clear visual state changes** for buttons
- **Tooltips** for all icon-only buttons
- **Screen-reader friendly** structure with semantic HTML

---

## Performance Considerations

- **Canvas-based** rendering for smooth performance
- **CSS animations** limited to essential feedback (pulse, twinkle)
- **Fixed positioned** overlays for smooth scrolling
- **Optimized** gradients and borders for retro aesthetic without lag