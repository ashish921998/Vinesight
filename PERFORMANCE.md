# VineSight Performance Optimizations

This document outlines all the performance optimizations implemented in VineSight to ensure fast page loads, smooth interactions, and excellent Core Web Vitals scores.

## 📊 Core Web Vitals Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8s
- **TTFB (Time to First Byte)**: < 800ms

## 🚀 Implemented Optimizations

### 1. **Code Splitting & Lazy Loading**

#### TensorFlow.js Lazy Loading
```typescript
// Before: Imported eagerly, added ~4MB to initial bundle
import * as tf from '@tensorflow/tfjs'

// After: Lazy loaded when needed
private static async loadTensorFlow() {
  if (!this.tfPromise) {
    this.tfPromise = import('@tensorflow/tfjs')
  }
  return this.tfPromise
}
```

#### React Markdown Lazy Loading
```typescript
// LazyMarkdown component that loads on-demand
export const LazyMarkdown = memo(function LazyMarkdown({ content }) {
  const [Markdown, setMarkdown] = useState(null)
  
  useEffect(() => {
    Promise.all([
      import('react-markdown'),
      import('remark-gfm')
    ]).then(([markdownModule, gfmModule]) => {
      setMarkdown(() => markdownModule.default)
      // ...
    })
  }, [])
  
  // ...
})
```

#### Component Lazy Loading
```typescript
// AI Assistant lazy loaded to reduce initial bundle
const LazyAIAssistant = dynamic(
  () => import('../ai/AIAssistant').then(mod => ({ default: mod.AIAssistant })),
  { ssr: false, loading: () => <LoadingSpinner /> }
)
```

### 2. **Font Optimization**

```typescript
// Only critical font preloaded
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true  // Only this one
})

// Non-critical fonts deferred
const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  display: 'swap',
  preload: false  // Deferred loading
})
```

### 3. **Package Optimization**

```javascript
// next.config.mjs
experimental: {
  optimizePackageImports: [
    'lucide-react',
    '@radix-ui/react-select',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-tooltip',
    'jspdf',
    'date-fns',
    'react-markdown',
    'framer-motion'
  ]
}
```

### 4. **API Response Caching**

```typescript
// Cache service for weather and other API data
export const cacheService = new CacheService()

// Weather API with caching
static async getWeatherData(latitude, longitude, startDate, endDate) {
  const cacheKey = `weather:${latitude}:${longitude}:${startDate}:${endDate}`
  const cached = cacheService.get(cacheKey)
  if (cached) return cached
  
  const data = await fetch(url, {
    next: { revalidate: 300 } // 5 minutes
  })
  
  cacheService.set(cacheKey, data, CACHE_TTL.MEDIUM)
  return data
}
```

### 5. **React Performance Optimizations**

#### useMemo for Expensive Calculations
```typescript
const sortedConversations = useMemo(
  () => conversations
    .map(conversation => ({
      ...conversation,
      updatedAt: conversation.updatedAt instanceof Date 
        ? conversation.updatedAt 
        : new Date(conversation.updatedAt)
    }))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
  [conversations]
)
```

#### useCallback for Event Handlers
```typescript
const formatMessage = useCallback(
  (content: string, isAssistant: boolean) => {
    if (isAssistant) {
      return <LazyMarkdown content={content} />
    }
    return content.split(/\n+/).filter(Boolean).map((line, index) => (
      <p key={`${index}-${line.slice(0, 24)}`}>{line}</p>
    ))
  },
  []
)
```

#### React.memo for Component Memoization
```typescript
export const LazyMarkdown = memo(function LazyMarkdown({ content, className }) {
  // Component only re-renders when content or className changes
  // ...
})
```

### 6. **Image Optimization**

```typescript
// OptimizedImage component with progressive loading
export function OptimizedImage({ fallbackSrc, alt, ...props }) {
  return (
    <Image
      {...props}
      alt={alt}
      loading="lazy"
      quality={85}
      className={`${props.className} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all`}
    />
  )
}
```

```javascript
// next.config.mjs
images: {
  formats: ['image/webp', 'image/avif'],
  minimumCacheTTL: 60,
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
}
```

### 7. **Cache Control Headers**

```javascript
// Static assets cached for 1 year
{
  source: '/static/(.*)',
  headers: [{
    key: 'Cache-Control',
    value: 'public, max-age=31536000, immutable'
  }]
}

// Service worker updates on every request
{
  source: '/sw.js',
  headers: [{
    key: 'Cache-Control',
    value: 'public, max-age=0, must-revalidate'
  }]
}
```

### 8. **Performance Monitoring**

```typescript
// Automatic Core Web Vitals tracking
import { PerformanceMonitor } from '@/lib/performance-monitor'

PerformanceMonitor.initializeCoreWebVitals()

// Custom performance marks
PerformanceMonitor.mark('data-fetch-start')
await fetchData()
PerformanceMonitor.mark('data-fetch-end')
PerformanceMonitor.measure('data-fetch', 'data-fetch-start', 'data-fetch-end')
```

## 🛠️ Utility Functions

### Memoization
```typescript
import { memoize } from '@/lib/memoized-utils'

const expensiveCalculation = memoize((x, y) => {
  // Expensive computation
  return result
})
```

### Debouncing
```typescript
import { debounce } from '@/lib/memoized-utils'

const handleSearch = debounce((query) => {
  // API call
}, 300)
```

### Throttling
```typescript
import { throttle } from '@/lib/memoized-utils'

const handleScroll = throttle(() => {
  // Scroll handler
}, 100)
```

### LRU Cache
```typescript
import { LRUCache } from '@/lib/memoized-utils'

const cache = new LRUCache(100)
cache.set('key', data)
const cachedData = cache.get('key')
```

## 📦 Bundle Size Optimization

### Current Optimizations
- ✅ Dynamic imports for heavy libraries
- ✅ Tree-shaking enabled
- ✅ Package optimization in Next.js config
- ✅ Remove unused code in production
- ✅ Console logs removed in production

### Monitoring Bundle Size
```bash
# Analyze bundle size
npm run build:analyze

# Check bundle size
npm run size
```

## 🔍 Performance Testing

### Local Performance Testing
```bash
# Build and test production bundle
npm run build
npm run start
```

### Lighthouse Testing
1. Open DevTools
2. Navigate to Lighthouse tab
3. Run audit for Performance, Accessibility, Best Practices, SEO
4. Target scores:
   - Performance: 90+
   - Accessibility: 95+
   - Best Practices: 95+
   - SEO: 95+

## 📝 Best Practices

### When to Use Each Optimization

#### use `useMemo` when:
- Computing expensive derived state
- Filtering/sorting large arrays
- Creating complex objects/arrays that are used as dependencies

#### Use `useCallback` when:
- Passing callbacks to optimized child components
- Functions used as dependencies in other hooks
- Event handlers in frequently re-rendering components

#### Use `React.memo` when:
- Component receives same props frequently
- Component is expensive to render
- Component renders frequently with same props

#### Use dynamic imports when:
- Component > 50KB
- Component only needed in specific routes
- Third-party library > 100KB

#### Use caching when:
- API calls with same parameters
- Expensive computations with same inputs
- Data that doesn't change frequently

## 🎯 Future Optimizations

### Planned Improvements
1. [ ] Implement React Server Components for data fetching
2. [ ] Add route-based code splitting
3. [ ] Implement service worker for offline caching
4. [ ] Add request deduplication for API calls
5. [ ] Implement virtual scrolling for large lists
6. [ ] Add image optimization pipeline
7. [ ] Implement preloading for critical resources
8. [ ] Add route prefetching on hover

### Monitoring
- Track bundle size changes in CI/CD
- Monitor Core Web Vitals in production
- Set up performance budgets
- Regular Lighthouse audits

## 🔧 Development Guidelines

### Before Adding a New Dependency
1. Check bundle size impact: `npm run build:analyze`
2. Look for lighter alternatives
3. Consider lazy loading if > 50KB
4. Check if functionality can be implemented natively

### Before Deploying
1. Run production build: `npm run build`
2. Check bundle size: `npm run size`
3. Run Lighthouse audit
4. Test on slow 3G connection
5. Test on low-end mobile device

## 📚 Additional Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Performance](https://react.dev/reference/react/memo)
- [Web Vitals](https://web.dev/vitals/)
- [Bundle Size Optimization](https://web.dev/reduce-javascript-payloads-with-code-splitting/)
