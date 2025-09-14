'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Calendar,
  User,
  ArrowLeft,
  Clock,
  Share2,
  Droplets,
  Bug,
  BarChart3,
  Brain,
  Leaf,
  Sun,
} from 'lucide-react'
import { SEOSchema } from '@/components/SEOSchema'
import Link from 'next/link'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  publishDate: string
  readTime: number
  category: string
  tags: string[]
  imageUrl: string
  featured?: boolean
}

interface BlogCategory {
  id: string
  name: string
  icon: any
  count: number
  color: string
}

const blogCategories: BlogCategory[] = [
  {
    id: 'farming-tips',
    name: 'Farming Tips',
    icon: Leaf,
    count: 24,
    color: 'bg-green-100 text-green-700',
  },
  {
    id: 'weather-insights',
    name: 'Weather & Climate',
    icon: Sun,
    count: 18,
    color: 'bg-yellow-100 text-yellow-700',
  },
  {
    id: 'pest-management',
    name: 'Pest Management',
    icon: Bug,
    count: 15,
    color: 'bg-red-100 text-red-700',
  },
  {
    id: 'irrigation-water',
    name: 'Irrigation & Water',
    icon: Droplets,
    count: 22,
    color: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'ai-technology',
    name: 'AI & Technology',
    icon: Brain,
    count: 12,
    color: 'bg-purple-100 text-purple-700',
  },
  {
    id: 'market-analysis',
    name: 'Market Analysis',
    icon: BarChart3,
    count: 19,
    color: 'bg-indigo-100 text-indigo-700',
  },
]

const featuredPosts: BlogPost[] = [
  {
    id: 'optimal-irrigation-timing',
    title: 'Mastering ETc Calculations for Optimal Grape Irrigation',
    excerpt:
      'Learn how to use evapotranspiration data to optimize your irrigation schedule and reduce water waste by up to 30%.',
    content: 'Full article content...',
    author: 'Dr. Rajesh Vinekar',
    publishDate: '2024-01-15',
    readTime: 8,
    category: 'irrigation-water',
    tags: ['ETc', 'irrigation', 'water management', 'efficiency'],
    imageUrl: '/blog/irrigation-timing.jpg',
    featured: true,
  },
  {
    id: 'ai-pest-prediction',
    title: 'How AI Predicts Pest Outbreaks 72 Hours in Advance',
    excerpt:
      'Discover the science behind our AI-powered pest prediction system and how it helps farmers prevent crop damage.',
    content: 'Full article content...',
    author: 'Priya Sharma',
    publishDate: '2024-01-12',
    readTime: 6,
    category: 'ai-technology',
    tags: ['AI', 'pest prediction', 'machine learning', 'prevention'],
    imageUrl: '/blog/ai-pest-prediction.jpg',
    featured: true,
  },
  {
    id: 'monsoon-preparedness',
    title: 'Complete Monsoon Preparedness Guide for Grape Farmers',
    excerpt:
      'Essential steps to protect your vineyard during monsoon season, from drainage to disease prevention.',
    content: 'Full article content...',
    author: 'Amit Patil',
    publishDate: '2024-01-10',
    readTime: 12,
    category: 'weather-insights',
    tags: ['monsoon', 'weather', 'crop protection', 'preparation'],
    imageUrl: '/blog/monsoon-prep.jpg',
    featured: true,
  },
]

const recentPosts: BlogPost[] = [
  {
    id: 'nutrient-deficiency-signs',
    title: 'Identifying Nutrient Deficiencies in Grape Vines',
    excerpt: 'Visual guide to recognizing common nutrient deficiencies and corrective measures.',
    content: 'Full article content...',
    author: 'Dr. Sunita Desai',
    publishDate: '2024-01-08',
    readTime: 7,
    category: 'farming-tips',
    tags: ['nutrients', 'deficiency', 'plant health', 'fertilizers'],
    imageUrl: '/blog/nutrient-deficiency.jpg',
  },
  {
    id: 'market-trends-2024',
    title: 'Indian Grape Market Trends and Export Opportunities 2024',
    excerpt:
      'Analysis of current market conditions and emerging export opportunities for Indian grape farmers.',
    content: 'Full article content...',
    author: 'Kavita Joshi',
    publishDate: '2024-01-05',
    readTime: 10,
    category: 'market-analysis',
    tags: ['market trends', 'export', 'pricing', 'opportunities'],
    imageUrl: '/blog/market-trends.jpg',
  },
  {
    id: 'organic-pest-control',
    title: 'Effective Organic Pest Control Methods for Grapes',
    excerpt:
      'Natural and sustainable approaches to managing common grape pests without harmful chemicals.',
    content: 'Full article content...',
    author: 'Ravi Kumar',
    publishDate: '2024-01-02',
    readTime: 9,
    category: 'pest-management',
    tags: ['organic', 'pest control', 'sustainable', 'natural'],
    imageUrl: '/blog/organic-pest-control.jpg',
  },
  {
    id: 'smart-irrigation-systems',
    title: 'Setting Up Smart Irrigation Systems with IoT Sensors',
    excerpt:
      'Step-by-step guide to implementing automated irrigation using soil moisture sensors and weather data.',
    content: 'Full article content...',
    author: 'Arjun Reddy',
    publishDate: '2023-12-28',
    readTime: 15,
    category: 'ai-technology',
    tags: ['IoT', 'automation', 'sensors', 'smart farming'],
    imageUrl: '/blog/smart-irrigation.jpg',
  },
  {
    id: 'pruning-techniques',
    title: 'Advanced Pruning Techniques for Maximum Yield',
    excerpt:
      'Professional pruning methods to improve grape quality, increase yield, and maintain vine health.',
    content: 'Full article content...',
    author: 'Sneha Kulkarni',
    publishDate: '2023-12-25',
    readTime: 11,
    category: 'farming-tips',
    tags: ['pruning', 'yield', 'vine management', 'techniques'],
    imageUrl: '/blog/pruning-techniques.jpg',
  },
  {
    id: 'climate-resilient-farming',
    title: 'Building Climate Resilience in Grape Farming',
    excerpt:
      'Strategies to adapt your farming practices to changing climate conditions and extreme weather.',
    content: 'Full article content...',
    author: 'Dr. Meera Nair',
    publishDate: '2023-12-22',
    readTime: 13,
    category: 'weather-insights',
    tags: ['climate change', 'resilience', 'adaptation', 'sustainability'],
    imageUrl: '/blog/climate-resilience.jpg',
  },
]

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<string | null>(null)

  const allPosts = [...featuredPosts, ...recentPosts]

  const filteredPosts = allPosts.filter((post) => {
    const matchesSearch =
      searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === null || post.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const filteredCategories = blogCategories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (selectedPost) {
    const post = allPosts.find((p) => p.id === selectedPost)
    if (post) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
          <SEOSchema
            title={`${post.title} - VineSight Blog`}
            description={post.excerpt}
            type="article"
            image="https://farmai.vercel.app/og-image.png"
          />

          <div className="bg-white border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-4 py-6">
              <Button variant="ghost" onClick={() => setSelectedPost(null)} className="mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Button>

              <div className="mb-8">
                <Badge
                  className={`${blogCategories.find((c) => c.id === post.category)?.color} mb-4`}
                >
                  {blogCategories.find((c) => c.id === post.category)?.name}
                </Badge>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
                <div className="flex items-center gap-6 text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(post.publishDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{post.readTime} min read</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="prose prose-lg max-w-none">
                <p className="text-xl text-gray-600 mb-8">{post.excerpt}</p>
                <div className="text-center py-16 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Full Article Coming Soon
                  </h3>
                  <p className="text-gray-500">
                    We're working on detailed articles for our blog. Stay tuned for comprehensive
                    content!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share Article
              </Button>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <SEOSchema
        title="Blog - VineSight Grape Farming Insights"
        description="Expert insights, tips, and guides for grape farming. Learn about irrigation, pest management, AI technology, and market trends from agricultural experts."
        type="website"
        image="https://farmai.vercel.app/og-image.png"
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                <Leaf className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">VineSight Blog</h1>
            </div>
            <p className="text-xl text-gray-600 mb-8">
              Expert insights and practical guides for modern grape farming
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search articles, topics, or farming tips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Categories */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse by Category</h2>
          <p className="text-gray-600 mb-8">Explore articles organized by farming topics</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {filteredCategories.map((category) => (
              <Card
                key={category.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedCategory === category.id ? 'ring-2 ring-green-500 bg-green-50' : ''
                }`}
                onClick={() =>
                  setSelectedCategory(selectedCategory === category.id ? null : category.id)
                }
              >
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <category.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <h3 className="font-medium text-sm text-gray-900 mb-1">{category.name}</h3>
                  <p className="text-xs text-gray-500">{category.count} articles</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedCategory && (
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">
                Showing {filteredPosts.length} articles in "
                {blogCategories.find((c) => c.id === selectedCategory)?.name}"
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                Clear filter
              </Button>
            </div>
          )}
        </div>

        {/* Featured Posts */}
        {!selectedCategory && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Featured Articles</h2>
            <p className="text-gray-600 mb-8">Must-read articles from our farming experts</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {featuredPosts.map((post, index) => (
                <Card
                  key={post.id}
                  className={`cursor-pointer hover:shadow-xl transition-all group ${
                    index === 0 ? 'lg:col-span-2 lg:row-span-2' : ''
                  }`}
                  onClick={() => setSelectedPost(post.id)}
                >
                  <div className="relative h-48 lg:h-60 bg-gradient-to-br from-green-100 to-blue-100 rounded-t-lg">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {blogCategories.find((c) => c.id === post.category)?.icon &&
                        React.createElement(
                          blogCategories.find((c) => c.id === post.category)!.icon,
                          {
                            className: 'h-16 w-16 text-green-600 opacity-50',
                          },
                        )}
                    </div>
                    <Badge
                      className={`absolute top-4 left-4 ${blogCategories.find((c) => c.id === post.category)?.color}`}
                    >
                      {blogCategories.find((c) => c.id === post.category)?.name}
                    </Badge>
                  </div>
                  <CardContent className="p-6">
                    <h3
                      className={`font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors ${
                        index === 0 ? 'text-xl' : 'text-lg'
                      }`}
                    >
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span>{post.author}</span>
                        <span>{new Date(post.publishDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{post.readTime}m</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Posts or Filtered Posts */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedCategory ? 'Category Articles' : 'Recent Articles'}
          </h2>
          <p className="text-gray-600 mb-8">
            {selectedCategory
              ? `Latest articles in ${blogCategories.find((c) => c.id === selectedCategory)?.name.toLowerCase()}`
              : 'Latest farming insights and expert tips'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(selectedCategory ? filteredPosts : recentPosts).map((post) => (
              <Card
                key={post.id}
                className="cursor-pointer hover:shadow-xl transition-all group"
                onClick={() => setSelectedPost(post.id)}
              >
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {blogCategories.find((c) => c.id === post.category)?.icon &&
                      React.createElement(
                        blogCategories.find((c) => c.id === post.category)!.icon,
                        {
                          className: 'h-12 w-12 text-gray-400',
                        },
                      )}
                  </div>
                  <Badge
                    className={`absolute top-4 left-4 ${blogCategories.find((c) => c.id === post.category)?.color}`}
                  >
                    {blogCategories.find((c) => c.id === post.category)?.name}
                  </Badge>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-3">
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>{new Date(post.publishDate).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{post.readTime}m</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {filteredPosts.length === 0 && searchQuery && (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No articles found</h3>
            <p className="text-gray-500">Try adjusting your search terms or browse by category</p>
          </div>
        )}
      </div>
    </div>
  )
}
