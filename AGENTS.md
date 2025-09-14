# AGENTS.md - VineSight Development Guide

## Build & Development Commands
- `npm run dev` or `npm run dev --turbopack` - Start development server  
- `npm run build` - Production build
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run start` - Start production server
- No test framework configured - check with user before assuming test setup

## Architecture & Structure
- **Framework**: Next.js 15 with App Router, React 19, TypeScript
- **Database**: Supabase with PostgreSQL and Row Level Security
- **UI**: shadcn/ui components with Radix UI and Tailwind CSS  
- **AI**: Multiple providers (OpenAI, Google AI, Groq) with TensorFlow.js for computer vision
- **PWA**: Progressive Web App with offline support via next-pwa and Dexie
- **Internationalization**: i18next with Hindi/Marathi support
- **Key directories**: `src/app/` (pages), `src/components/` (UI), `src/lib/` (services), `src/hooks/` (React hooks)

## Code Style & Conventions
- **Imports**: Use `@/` path alias for src imports, separate UI from business logic imports
- **Components**: PascalCase files (.tsx), functional components with TypeScript interfaces  
- **Props**: ComponentNameProps interface pattern (e.g., `SprayFormProps`)
- **Hooks**: camelCase with `use` prefix, custom hooks in `src/hooks/`
- **Functions**: camelCase with descriptive verbs (handleSubmit, fetchData)
- **Files**: PascalCase components, kebab-case utilities, camelCase hooks
- **State**: Prefer useState with descriptive names, avoid suppressing TS errors
- **Styling**: Use cn() utility for conditional classes, shadcn/ui component variants
- **Error handling**: Follow security best practices, never expose secrets or use background processes

## Database & Types
- **Supabase**: Row Level Security enabled, type-safe database operations
- **Types**: Generated from Supabase schema, use proper Database types
- **Auth**: Supabase Auth with custom useSupabaseAuth hook
