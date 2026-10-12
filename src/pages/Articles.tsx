import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { articlesApi } from '../lib/supabase'

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string
  author_id: string
  category: string
  is_published: boolean
  view_count: number
  published_at: string
  created_at: string
  updated_at: string
  tags: string[]
}

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true)
        const filters = {
          is_published: true,
          ...(selectedCategory !== 'all' && { category: selectedCategory })
        }
        const data = await articlesApi.list(filters)
        setArticles(data || [])
      } catch (err) {
        console.error('Error fetching articles:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [selectedCategory])

  // Extract unique categories
  const categories = ['all', ...new Set(articles.map(a => a.category).filter(Boolean))]

  return (
    <div className="bg-canvas">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-50 via-white to-brand-50 py-16">
        <div className="container-page">
          <h1 className="font-display text-4xl font-bold text-ink lg:text-5xl">
            Articles & Resources
          </h1>
          <p className="mt-4 text-xl text-muted max-w-2xl">
            Explore our collection of educational articles on anatomy, physiology, and medical sciences.
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="border-b border-line bg-white sticky top-0 z-10">
        <div className="container-page">
          <div className="flex gap-4 overflow-x-auto py-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-brand-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All Articles' : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="container-page py-12">
        {loading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-2xl font-semibold text-ink">No articles found</p>
            <p className="mt-2 text-muted">
              {selectedCategory !== 'all' 
                ? 'Try selecting a different category' 
                : 'Check back soon for new content'}
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/articles/${article.slug}`}
                className="group overflow-hidden rounded-xl border border-line bg-white shadow-sm transition-all hover:shadow-md"
              >
                {/* Cover Image */}
                {article.cover_image ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={article.cover_image}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="relative h-48 bg-gradient-to-br from-brand-50 to-brand-100"></div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Category */}
                  {article.category && (
                    <span className="inline-block text-xs font-semibold uppercase tracking-wider text-brand-700 mb-2">
                      {article.category}
                    </span>
                  )}

                  {/* Title */}
                  <h3 className="font-display text-xl font-semibold text-ink group-hover:text-brand-700 transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  {article.excerpt && (
                    <p className="mt-2 text-sm text-muted line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                    <time dateTime={article.published_at || article.created_at}>
                      {new Date(article.published_at || article.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </time>
                    {article.view_count > 0 && (
                      <>
                        <span>•</span>
                        <span>{article.view_count} views</span>
                      </>
                    )}
                  </div>

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                      {article.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
