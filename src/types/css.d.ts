// Side-effect CSS imports (e.g. `import './globals.css'`) need a module
// declaration under TypeScript 6.0+, which errors on unresolved side-effect
// imports (TS2882). The actual CSS is handled by Next's bundler at build time.
declare module '*.css'
