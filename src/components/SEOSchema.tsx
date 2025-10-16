'use client'

import { SEO_KEYWORDS } from '@/app/layout'

interface SEOSchemaProps {
  type?: 'homepage' | 'dashboard' | 'calculator' | 'guide' | 'product'
  title?: string
  description?: string
  url?: string
  image?: string
  calculatorType?: string
  guideCategory?: string
}

// SEO Schema Type Definitions
interface SchemaOrganization {
  '@type': 'Organization'
  '@id': string
  name: string
  url: string
  logo: {
    '@type': 'ImageObject'
    url: string
    width: number
    height: number
  }
  sameAs: string[]
  description: string
}

interface SchemaWebSite {
  '@type': 'WebSite'
  '@id': string
  url: string
  name: string
  publisher: {
    '@id': string
  }
  potentialAction: {
    '@type': 'SearchAction'
    target: string
    'query-input': string
  }
}

interface SchemaWebPage {
  '@type': 'WebPage'
  '@id': string
  url: string
  name: string
  description: string
  isPartOf: {
    '@id': string
  }
  about?: {
    '@id': string
  }
  mainEntity?: SchemaSoftwareApplication | SchemaWebApplication
}

interface SchemaSoftwareApplication {
  '@type': 'SoftwareApplication'
  name: string
  applicationCategory: string
  operatingSystem: string
  offers: {
    '@type': 'Offer'
    price: string
    priceCurrency: string
  }
  aggregateRating?: {
    '@type': 'AggregateRating'
    ratingValue: string
    ratingCount?: string
    bestRating?: string
    worstRating?: string
  }
  featureList?: string[]
}

interface SchemaWebApplication {
  '@type': 'WebApplication'
  name: string
  applicationCategory: string
  applicationSubCategory?: string
  description?: string
  operatingSystem: string
  browserRequirements: string
  offers: {
    '@type': 'Offer'
    price: string
    priceCurrency: string
  }
}

interface SchemaArticle {
  '@type': 'Article'
  '@id': string
  headline?: string
  description?: string
  url: string
  datePublished?: string
  dateModified?: string
  author?: {
    '@type'?: string
    name?: string
    '@id'?: string
  }
  publisher?: {
    '@type'?: string
    name?: string
    logo?: {
      '@type'?: string
      url?: string
    }
    '@id'?: string
  }
  mainEntityOfPage?: {
    '@type'?: string
    '@id': string
  }
  articleSection?: string
  keywords?: string
  image?: {
    '@type': string
    url: string
    width: number
    height: number
  }
}

interface SchemaProduct {
  '@type': 'Product'
  '@id': string
  name: string
  description: string
  category: string
  brand: {
    '@id': string
  }
  offers: {
    '@type': 'Offer'
    price: string
    priceCurrency: string
    availability: string
  }
  aggregateRating?: {
    '@type': 'AggregateRating'
    ratingValue: string
    ratingCount: string
  }
}

type SchemaGraphItem = SchemaOrganization | SchemaWebSite | SchemaWebPage | SchemaArticle | SchemaSoftwareApplication | SchemaWebApplication | SchemaProduct

interface BaseSchema {
  '@context': string
  '@graph': SchemaGraphItem[]
}

export function SEOSchema({
  type = 'homepage',
  title,
  description,
  url,
  image,
  calculatorType,
  guideCategory
}: SEOSchemaProps) {
  const baseSchema: BaseSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://vinesight.vercel.app/#organization',
        name: 'VineSight',
        url: 'https://vinesight.vercel.app',
        logo: {
          '@type': 'ImageObject',
          url: 'https://vinesight.vercel.app/icon-512x512.png',
          width: 512,
          height: 512
        },
        sameAs: ['https://twitter.com/VineSight', 'https://linkedin.com/company/vinesight'],
        description:
          'AI-powered smart farm management system for precision agriculture and intelligent crop monitoring'
      },
      {
        '@type': 'WebSite',
        '@id': 'https://vinesight.vercel.app/#website',
        url: 'https://vinesight.vercel.app',
        name: 'VineSight - Smart Farm Management System',
        publisher: {
          '@id': 'https://vinesight.vercel.app/#organization'
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://vinesight.vercel.app/search?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      }
    ]
  }

  // Homepage Schema
  if (type === 'homepage') {
    const homepagePage: SchemaWebPage = {
      '@type': 'WebPage',
      '@id': 'https://vinesight.vercel.app/#webpage',
      url: 'https://vinesight.vercel.app',
      name: 'VineSight - AI-Powered Smart Farm Management System',
      description:
        'Transform your farming operations with AI-driven crop monitoring, yield prediction, disease detection, and automation for modern agriculture.',
      isPartOf: {
        '@id': 'https://vinesight.vercel.app/#website'
      },
      about: {
        '@id': 'https://vinesight.vercel.app/#organization'
      },
      mainEntity: {
        '@type': 'SoftwareApplication',
        name: 'VineSight',
        applicationCategory: 'AgricultureApplication',
        operatingSystem: 'Web, iOS, Android',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '156',
          bestRating: '5',
          worstRating: '1'
        },
        featureList: [
          'AI Crop Monitoring',
          'Yield Prediction',
          'Disease Detection',
          'Weather Analytics',
          'Irrigation Management',
          'Harvest Planning',
          'Farm Analytics'
        ]
      }
    }
    baseSchema['@graph'].push(homepagePage)
  }

  // Calculator Schema
  if (type === 'calculator') {
    const calculatorPage: SchemaWebPage = {
      '@type': 'WebPage',
      '@id': `https://vinesight.vercel.app${url || ''}#webpage`,
      url: `https://vinesight.vercel.app${url || ''}`,
      name: title || 'Farm Calculator',
      description: description || 'Scientific agricultural calculator for farming operations',
      isPartOf: {
        '@id': 'https://vinesight.vercel.app/#website'
      },
      mainEntity: {
        '@type': 'WebApplication',
        name: title || 'Farm Calculator',
        applicationCategory: 'CalculatorApplication',
        applicationSubCategory: 'Agriculture',
        description: description,
        operatingSystem: 'Web',
        browserRequirements: 'Requires JavaScript',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        }
      }
    }
    baseSchema['@graph'].push(calculatorPage)
  }

  // Guide/Article Schema
  if (type === 'guide') {
    const guideArticle: SchemaArticle = {
      '@type': 'Article',
      '@id': `https://vinesight.vercel.app${url || ''}#article`,
      headline: title,
      description: description,
      url: `https://vinesight.vercel.app${url || ''}`,
      datePublished: '2025-10-15',
      dateModified: '2025-10-15',
      author: {
        '@id': 'https://vinesight.vercel.app/#organization'
      },
      publisher: {
        '@id': 'https://vinesight.vercel.app/#organization'
      },
      articleSection: guideCategory || 'Agriculture',
      keywords: SEO_KEYWORDS,
      image: {
        '@type': 'ImageObject',
        url: image || 'https://vinesight.vercel.app/og-image.png',
        width: 1200,
        height: 630
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://vinesight.vercel.app${url || ''}#webpage`
      }
    }
    baseSchema['@graph'].push(guideArticle)
  }

  // Product Schema for Dashboard
  if (type === 'product') {
    const productSchema: SchemaProduct = {
      '@type': 'Product',
      '@id': 'https://vinesight.vercel.app/dashboard#product',
      name: 'VineSight Dashboard',
      description: 'Comprehensive farm management dashboard with AI-powered insights and analytics',
      category: 'Software',
      brand: {
        '@id': 'https://vinesight.vercel.app/#organization'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '156'
      }
    }
    baseSchema['@graph'].push(productSchema)
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(baseSchema, null, 2)
      }}
    />
  )
}
