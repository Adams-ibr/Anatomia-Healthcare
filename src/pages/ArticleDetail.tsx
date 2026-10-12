import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    const fetchArticle = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await articlesApi.getBySlug(slug)
        
        if (!data || !data.is_published) {
          setError('Article not found or not published')
          return
        }
        
        setArticle(data)
      } catch (err) {
        console.error('Error fetching article:', err)
        setError('Failed to load article')
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [slug])

  if (loading) {
    return (
      <div className="container-page py-24">
        <div className="mx-auto max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="container-page py-24 text-center">
        <p className="font-display text-6xl font-bold text-brand-700">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Article not found</h1>
        <p className="mt-2 text-muted">{error || 'The article you\'re looking for doesn\'t exist or has been removed.'}</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-6">Back to home</button>
      </div>
    )
  }

  return (
    <div className="bg-canvas">
      {/* Article Header */}
      <div className="bg-gradient-to-br from-brand-50 via-white to-brand-50 py-12">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            {/* Category Badge */}
            {article.category && (
              <div className="mb-4">
                <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700">
                  {article.category}
                </span>
              </div>
            )}
            
            {/* Title */}
            <h1 className="font-display text-4xl font-bold text-ink lg:text-5xl">
              {article.title}
            </h1>
            
            {/* Excerpt */}
            {article.excerpt && (
              <p className="mt-4 text-xl text-muted">
                {article.excerpt}
              </p>
            )}
            
            {/* Meta Info */}
            <div className="mt-6 flex items-center gap-4 text-sm text-muted">
              <time dateTime={article.published_at || article.created_at}>
                {new Date(article.published_at || article.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
              <span>•</span>
              <span>{article.view_count} views</span>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="container-page py-12">
        <div className="mx-auto max-w-3xl">
          {/* Cover Image */}
          {article.cover_image && (
            <div className="mb-8 overflow-hidden rounded-xl">
              <img
                src={article.cover_image}
                alt={article.title}
                className="h-auto w-full object-cover"
              />
            </div>
          )}

          {/* Article Body */}
          <div className="prose prose-lg max-w-none">
            <div 
              dangerouslySetInnerHTML={{ __html: article.content }}
              className="space-y-4 text-ink"
            />
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-12 border-t border-line pt-8">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="mt-12 border-t border-line pt-8">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-brand-700 hover:text-brand-800 font-medium"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
