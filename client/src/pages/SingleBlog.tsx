import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Article } from "@shared/schema";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatFullDate } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  User,
  BookmarkPlus,
  Share2,
  ThumbsUp,
  ChevronRight,
  Loader2
} from "lucide-react";

export default function SingleBlog() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: [`/api/articles/${slug}`],
    enabled: !!slug,
  });

  const { data: allArticles = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const relatedArticles = allArticles
    .filter(a => a.slug !== slug)
    .slice(0, 3);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !article) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h1 className="text-2xl font-bold text-foreground mb-2">Article Not Found</h1>
          <p className="text-muted-foreground mb-4">The article you're looking for doesn't exist or has been removed.</p>
          <Link href="/blog">
            <Button>Back to Articles</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-4 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/blog" className="hover:text-primary transition-colors">Articles</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{article.category}</span>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">{article.category?.toUpperCase()}</Badge>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="text-article-title">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span>{article.author}</span>
            </div>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {article.createdAt
                ? formatFullDate(article.createdAt)
                : ""}
              {article.readTime ? ` · ${article.readTime}` : ""}
            </span>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-4 gap-8">
            <article className="lg:col-span-3">
              {article.imageUrl && (
                <div className="aspect-video rounded-lg mb-8 overflow-hidden">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="prose prose-lg max-w-none dark:prose-invert">
                <p className="lead text-lg text-muted-foreground mb-8">
                  {article.excerpt}
                </p>

                <div
                  className="text-foreground whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              </div>

              <div className="flex items-center gap-4 py-6 border-t border-b border-border mt-8">
                <Button variant="outline" size="sm" className="gap-2" data-testid="button-helpful">
                  <ThumbsUp className="w-4 h-4" />
                  Helpful
                </Button>
                <Button variant="outline" size="sm" className="gap-2" data-testid="button-save">
                  <BookmarkPlus className="w-4 h-4" />
                  Save
                </Button>
                <Button variant="outline" size="sm" className="gap-2" data-testid="button-share">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </article>

            <aside className="space-y-6">
              {article.author && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-foreground mb-2">Author</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{article.author}</p>
                        <Badge variant="outline" className="text-xs">Verified</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>
        </div>
      </section>

      {relatedArticles.length > 0 && (
        <section className="py-12 bg-card border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h3 className="text-xl font-bold text-foreground mb-6">Related Articles</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <Link key={related.id} href={`/blog/${related.slug}`}>
                  <Card className="h-full cursor-pointer transition-all duration-300 hover:shadow-lg">
                    <CardContent className="p-0">
                      <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
                        {related.imageUrl && (
                          <img src={related.imageUrl} alt={related.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-4">
                        <Badge variant="secondary" className="mb-2 text-xs">{related.category}</Badge>
                        <h4 className="font-semibold text-foreground">{related.title}</h4>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
