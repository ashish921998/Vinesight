'use client'

interface SEOSchemaProps {
  type?: 'homepage' | 'dashboard' | 'calculator' | 'guide' | 'product'
  title?: string
  description?: string
  url?: string
  image?: string
  calculatorType?: string
  guideCategory?: string
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
  const baseSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://farmai.vercel.app/#organization',
        name: 'FarmAI',
        url: 'https://farmai.vercel.app',
        logo: {
          '@type': 'ImageObject',
          url: 'https://farmai.vercel.app/icon-512x512.png',
          width: 512,
          height: 512
        },
        sameAs: ['https://twitter.com/FarmAI', 'https://linkedin.com/company/farmai'],
        description:
          'AI-powered smart farm management system for precision agriculture and intelligent crop monitoring'
      },
      {
        '@type': 'WebSite',
        '@id': 'https://farmai.vercel.app/#website',
        url: 'https://farmai.vercel.app',
        name: 'FarmAI - Smart Farm Management System',
        publisher: {
          '@id': 'https://farmai.vercel.app/#organization'
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://farmai.vercel.app/search?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      }
    ]
  }

  // Homepage Schema
  if (type === 'homepage') {
    baseSchema['@graph'].push({
      '@type': 'WebPage',
      '@id': 'https://farmai.vercel.app/#webpage',
      url: 'https://farmai.vercel.app',
      name: 'FarmAI - AI-Powered Smart Farm Management System',
      description:
        'Transform your farming operations with AI-driven crop monitoring, yield prediction, disease detection, and automation for modern agriculture.',
      // @ts-ignore
      isPartOf: {
        '@id': 'https://farmai.vercel.app/#website'
      },
      about: {
        '@id': 'https://farmai.vercel.app/#organization'
      },
      mainEntity: {
        '@type': 'SoftwareApplication',
        name: 'FarmAI',
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
    })
  }

  // Calculator Schema
  if (type === 'calculator') {
    baseSchema['@graph'].push({
      '@type': 'WebPage',
      '@id': `https://farmai.vercel.app${url}#webpage`,
      url: `https://farmai.vercel.app${url}`,
      name: title || 'Farm Calculator',
      description: description || 'Scientific agricultural calculator for farming operations',
      // @ts-ignore
      isPartOf: {
        '@id': 'https://farmai.vercel.app/#website'
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
    })
  }

  // Guide/Article Schema
  if (type === 'guide') {
    baseSchema['@graph'].push({
      '@type': 'Article',
      '@id': `https://farmai.vercel.app${url}#article`,
      // @ts-ignore
      headline: title,
      description: description,
      url: `https://farmai.vercel.app${url}`,
      datePublished: '2025-09-02',
      dateModified: '2025-09-02',
      author: {
        '@id': 'https://farmai.vercel.app/#organization'
      },
      publisher: {
        '@id': 'https://farmai.vercel.app/#organization'
      },
      articleSection: guideCategory || 'Agriculture',
      keywords: [
        'farm management',
        'agriculture',
        'farming techniques',
        'crop management',
        'precision agriculture'
      ],
      image: {
        '@type': 'ImageObject',
        url: image || 'https://farmai.vercel.app/og-image.png',
        width: 1200,
        height: 630
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://farmai.vercel.app${url}#webpage`
      }
    })
  }

  // Product Schema for Dashboard
  if (type === 'product') {
    baseSchema['@graph'].push({
      '@type': 'Product',
      '@id': 'https://farmai.vercel.app/dashboard#product',
      name: 'FarmAI Dashboard',
      description: 'Comprehensive farm management dashboard with AI-powered insights and analytics',
      // @ts-ignore
      category: 'Software',
      brand: {
        '@id': 'https://farmai.vercel.app/#organization'
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
    })
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
