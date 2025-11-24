# Performance Optimization Configuration Guide

## Next.js next.config.js Optimization

เพิ่มการตั้งค่าต่อไปนี้ใน `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode for better development experience
  reactStrictMode: true,

  // Enable SWC minification (faster than Terser)
  swcMinify: true,

  // Optimize images
  images: {
    domains: ['your-supabase-domain.supabase.co'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Compress responses
  compress: true,

  // Production source maps (disable in production for better performance)
  productionBrowserSourceMaps: false,

  // Optimize fonts
  optimizeFonts: true,

  // Enable experimental features
  experimental: {
    // Enable React Server Components
    serverActions: true,
    
    // Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
    ],
  },

  // Webpack optimization
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      }
    }

    return config
  },

  // Headers for better caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=60',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

## TypeScript Configuration Optimization

เพิ่มการตั้งค่าใน `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

## Package.json Scripts Optimization

เพิ่ม scripts ใน `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "analyze": "ANALYZE=true next build",
    "clean": "rm -rf .next out",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^14.0.0"
  }
}
```

## Bundle Analyzer Setup

สร้างไฟล์ `next.config.analyzer.js`:

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // Your next.config.js content here
})
```

## Environment Variables for Performance

สร้างไฟล์ `.env.production`:

```env
# Performance
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_CACHE_DURATION=300000

# API
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_API_RETRY_COUNT=3

# Features
NEXT_PUBLIC_ENABLE_SERVICE_WORKER=true
NEXT_PUBLIC_ENABLE_COMPRESSION=true
```

## Lighthouse CI Configuration

สร้างไฟล์ `.lighthouserc.js`:

```javascript
module.exports = {
  ci: {
    collect: {
      staticDistDir: './out',
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
```

## Performance Monitoring Script

สร้างไฟล์ `scripts/performance-test.js`:

```javascript
const { performance } = require('perf_hooks')

async function testPerformance() {
  console.log('🚀 Starting performance tests...\n')

  // Test 1: Database Query Performance
  console.log('1️⃣ Testing database queries...')
  const dbStart = performance.now()
  // Add your database queries here
  const dbEnd = performance.now()
  console.log(`   ✅ Database queries: ${(dbEnd - dbStart).toFixed(2)}ms\n`)

  // Test 2: API Response Time
  console.log('2️⃣ Testing API response time...')
  const apiStart = performance.now()
  // Add your API calls here
  const apiEnd = performance.now()
  console.log(`   ✅ API response: ${(apiEnd - apiStart).toFixed(2)}ms\n`)

  // Test 3: Component Render Time
  console.log('3️⃣ Testing component render time...')
  // Add your render tests here

  console.log('✨ Performance tests completed!')
}

testPerformance().catch(console.error)
```

## Git Pre-commit Hook for Performance

สร้างไฟล์ `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running type check..."
npm run type-check

echo "🔍 Running linter..."
npm run lint

echo "✅ Pre-commit checks passed!"
```

## Performance Checklist

### ✅ **Database**
- [ ] Run `scripts/012_performance_indexes.sql` in Supabase
- [ ] Enable connection pooling
- [ ] Use materialized views for complex queries
- [ ] Monitor query execution plans

### ✅ **Frontend**
- [ ] Implement code splitting
- [ ] Use lazy loading for components
- [ ] Optimize images (use Next.js Image)
- [ ] Minimize bundle size
- [ ] Enable compression

### ✅ **API**
- [ ] Implement caching
- [ ] Use pagination
- [ ] Compress responses
- [ ] Implement rate limiting
- [ ] Monitor response times

### ✅ **Caching**
- [ ] Implement client-side caching
- [ ] Use React Query or SWR
- [ ] Cache API responses
- [ ] Use service workers

### ✅ **Monitoring**
- [ ] Set up performance monitoring
- [ ] Track Core Web Vitals
- [ ] Monitor bundle size
- [ ] Log slow queries

## Performance Targets

### **Page Load**
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1
- Time to Interactive (TTI): < 3.8s

### **API Response**
- Average response time: < 200ms
- 95th percentile: < 500ms
- 99th percentile: < 1000ms

### **Database**
- Average query time: < 50ms
- Complex queries: < 200ms
- Index hit rate: > 99%

### **Bundle Size**
- Initial bundle: < 200KB (gzipped)
- Total JavaScript: < 500KB (gzipped)
- Total CSS: < 50KB (gzipped)

## Monitoring Tools

### **Development**
- Next.js Dev Tools
- React DevTools Profiler
- Chrome DevTools Performance
- Lighthouse
- Web Vitals Extension

### **Production**
- Vercel Analytics (if using Vercel)
- Google Analytics
- Sentry Performance Monitoring
- LogRocket
- New Relic

## Testing Commands

```bash
# Build and analyze bundle
npm run analyze

# Run Lighthouse CI
npx lhci autorun

# Test performance
node scripts/performance-test.js

# Check bundle size
npx next-bundle-analyzer

# Measure build time
time npm run build
```

## Continuous Optimization

### **Weekly**
- Review Lighthouse scores
- Check bundle size trends
- Monitor API response times
- Review error rates

### **Monthly**
- Update dependencies
- Review and optimize slow queries
- Clean up unused code
- Optimize images

### **Quarterly**
- Major performance audit
- Update performance targets
- Review caching strategies
- Optimize database indexes
