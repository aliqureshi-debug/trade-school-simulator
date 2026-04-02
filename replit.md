# TradeSchool

A trading education platform built with React, Vite, TypeScript, and shadcn/ui. Teaches users how to trade through interactive candlestick charts, a virtual $10,000 paper trading account, and an AI-style Trading Coach chat panel.

## Architecture

- **Frontend only** — Pure React SPA with no backend server
- **Build tool:** Vite with `@vitejs/plugin-react-swc`
- **UI:** shadcn/ui components + Tailwind CSS
- **Routing:** React Router v6
- **State / data fetching:** TanStack React Query
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod

## Project Structure

```
src/
  App.tsx          # Root component with routing setup
  pages/
    Index.tsx      # Main trading interface
    NotFound.tsx   # 404 page
  components/      # Reusable UI components (shadcn/ui + custom)
  hooks/           # Custom React hooks
  lib/             # Utility functions
  types/           # TypeScript type definitions
```

## Running Locally

```bash
npm run dev      # Start dev server on port 5000
npm run build    # Build for production → dist/
npm run preview  # Preview the production build
```

## Deployment

Configured as a **static** deployment:
- Build command: `npm run build`
- Public directory: `dist/`

## Key Configuration

- `vite.config.ts` — Dev server on `0.0.0.0:5000`, path alias `@` → `./src`
- `tailwind.config.ts` — Custom design tokens and animation config
- `components.json` — shadcn/ui component configuration
