# SWMMCRAFT Ultimate

## Overview

SWMMCRAFT Ultimate is a web-based stormwater management modeling tool that combines Minecraft-inspired pixel art aesthetics with professional hydraulic engineering functionality. The application provides an interactive canvas for designing drainage networks with nodes (junctions, outfalls, storage) and conduits (pipes), featuring simulation capabilities, a minimap, and day/night visual modes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite with custom plugins for Replit integration
- **Routing:** Wouter (lightweight React router)
- **State Management:** TanStack React Query for server state
- **UI Components:** shadcn/ui component library built on Radix UI primitives
- **Styling:** Tailwind CSS with custom Minecraft-themed design tokens

### Design System
- **Typography:** 'Press Start 2P' for pixel-style headers/buttons, 'VT323' for monospace data display
- **Visual Theme:** Minecraft stone-button 3D borders, gradient backgrounds, retro gaming aesthetic
- **Layout:** Fixed sidebar (280px), toolbar (54px), header with canvas filling remaining space
- **Color Palette:** HSL-based CSS variables with grass green (#5D9E3C), water blue (#3B9AE1), stone gray theme

### Backend Architecture
- **Runtime:** Node.js with Express
- **Language:** TypeScript (ESM modules)
- **API Pattern:** RESTful endpoints under `/api/` prefix
- **Data Validation:** Zod schemas with drizzle-zod integration

### Data Layer
- **ORM:** Drizzle ORM configured for PostgreSQL
- **Schema Location:** `shared/schema.ts` (shared between client and server)
- **Current Storage:** In-memory storage implementation (MemStorage class)
- **Migration Tool:** drizzle-kit for database schema management

### Project Structure
```
├── client/src/          # React frontend application
│   ├── components/ui/   # shadcn/ui component library
│   ├── pages/           # Route page components
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities and query client
├── server/              # Express backend
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Data persistence layer
│   └── vite.ts          # Vite dev server integration
├── shared/              # Shared types and schemas
└── migrations/          # Database migrations
```

### Build System
- **Development:** Vite dev server with HMR, proxied through Express
- **Production:** Vite builds static assets to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Path Aliases:** `@/` maps to client/src, `@shared/` maps to shared folder

## External Dependencies

### Database
- **PostgreSQL:** Primary database (via DATABASE_URL environment variable)
- **drizzle-orm:** Query builder and ORM
- **connect-pg-simple:** PostgreSQL session store (available but not currently active)

### UI Framework
- **Radix UI:** Accessible component primitives (dialog, dropdown, tabs, etc.)
- **Tailwind CSS:** Utility-first styling
- **class-variance-authority:** Component variant management
- **Lucide React:** Icon library

### Data & Forms
- **TanStack React Query:** Server state management and caching
- **React Hook Form:** Form state management
- **Zod:** Runtime type validation

### Canvas & Visualization
- **HTML5 Canvas API:** Core rendering for the stormwater network visualization
- **Embla Carousel:** Carousel component support
- **Recharts:** Charting library (available for data visualization)