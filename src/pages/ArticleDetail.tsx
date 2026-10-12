import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Clock, Eye, Calendar, ArrowLeft, Share2, BookOpen } from 'lucide-react'
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.excerpt,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Share failed:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="container-page py-8">
          <div className="mx-auto max-w-4xl">
            <div className="animate-pulse space-y-6">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-12 bg-gray-200 rounded w-3/4"></div>
              <div className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded-2xl"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-11/12"></div>
                <div className="h-4 bg-gray-200 rounded w-10/12"></div>
                <div className="h-4 bg-gray-200 rounded w-11/12"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center px-4">
          <BookOpen className="h-16 w-16 text-brand-300 mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold text-ink mb-2">Article Not Found</h1>
          <p className="text-muted mb-6 max-w-md">
            {error || 'The article you\'re looking for doesn\'t exist or has been removed.'}
          </p>
          <Link to="/articles" className="btn-primary">
            Browse All Articles
          </Link>
        </div>
      </div>
    )
  }

  const readTime = Math.ceil(article.content.split(' ').length / 200)

  return (
    <div className="min-h-screen bg-canvas">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-line bg-white">
        <div className="container-page py-4">
          <button
            onClick={() => navigate('/articles')}
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Articles
          </button>
        </div>
      </div>

      {/* Article Header */}
      <div className="bg-white border-b border-line">
        <div className="container-page py-12">
          <div className="mx-auto max-w-4xl">
            {/* Category Badge */}
            {article.category && (
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 border border-brand-200">
                  {article.category}
                </span>
              </div>
            )}
            
            {/* Title */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-ink leading-tight mb-6">
              {article.title}
            </h1>
            
            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-xl md:text-2xl text-muted leading-relaxed mb-8">
                {article.excerpt}
              </p>
            )}
            
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted border-t border-b border-line py-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={article.published_at || article.created_at}>
                  {new Date(article.published_at || article.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{readTime} min read</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{article.view_count.toLocaleString()} views</span>
              </div>

              <button
                onClick={handleShare}
                className="ml-auto flex items-center gap-2 text-brand-700 hover:text-brand-800 font-medium transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {article.cover_image && (
        <div className="bg-white">
          <div className="container-page py-8">
            <div className="mx-auto max-w-5xl">
              <div className="overflow-hidden rounded-2xl shadow-lg">
                <img
                  src={article.cover_image}
                  alt={article.title}
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Article Content */}
      <div className="bg-white">
        <div className="container-page py-12">
          <div className="mx-auto max-w-4xl">
            {/* Article Body with Enhanced Typography */}
            <article className="prose prose-lg md:prose-xl max-w-none
              prose-headings:font-display prose-headings:font-bold prose-headings:text-ink
              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
              prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
              prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-3
              prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-brand-700 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-ink prose-strong:font-semibold
              prose-ul:my-6 prose-ol:my-6
              prose-li:text-gray-700 prose-li:my-2
              prose-blockquote:border-l-4 prose-blockquote:border-brand-500 prose-blockquote:pl-6 prose-blockquote:italic
              prose-code:text-brand-700 prose-code:bg-brand-50 prose-code:px-2 prose-code:py-1 prose-code:rounded
              prose-pre:bg-gray-900 prose-pre:text-gray-100
              prose-img:rounded-xl prose-img:shadow-md
            ">
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </article>

            {/* Tags Section */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-16 pt-8 border-t border-line">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
                  Related Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="mt-16 p-8 bg-gradient-to-br from-brand-50 to-brand-100 rounded-2xl border border-brand-200">
              <h3 className="font-display text-2xl font-bold text-ink mb-3">
                Continue Learning
              </h3>
              <p className="text-muted mb-6">
                Explore more articles and resources to deepen your understanding of anatomy and medical sciences.
              </p>
              <Link to="/articles" className="btn-primary">
                Browse All Articles
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
