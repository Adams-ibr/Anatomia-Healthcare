import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/PageTransition";
import { AnimatedSection } from "@/components/AnimatedSection";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { useInViewAnimation } from "@/hooks/use-in-view-animation";
import {
  Clock,
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Article } from "@shared/schema";

const categories = ["All", "Musculoskeletal", "Neuroanatomy", "Visceral", "Clinical Case"];



export default function Blog() {
  const { data: apiArticles, isLoading } = useQuery<Article[]>({ queryKey: ["/api/articles"] });
  const articles = apiArticles || [];

  const featuredArticle = apiArticles?.find(a => a.isFeatured) || apiArticles?.[0];


  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [footerEmail, setFooterEmail] = useState("");
  const prefersReducedMotion = useReducedMotion();
  const articlesRef = useInViewAnimation({ threshold: 0.1 });

  const newsletterMutation = useMutation({
    mutationFn: async (emailAddress: string) => {
      return apiRequest("POST", "/api/newsletter", { email: emailAddress });
    },
    onSuccess: () => {
      toast({
        title: "Subscribed!",
        description: "You've been added to our newsletter.",
      });
      setEmail("");
      setFooterEmail("");
    },
    onError: (error: any) => {
      const message = error?.message?.includes("409")
        ? "This email is already subscribed."
        : "Failed to subscribe. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (emailAddress: string) => {
    if (!emailAddress || !emailAddress.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    newsletterMutation.mutate(emailAddress);
  };

  return (
    <Layout>
      <PageTransition>
        <section className="py-8 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-primary transition-colors">Resources</Link>
              <span>/</span>
              <span className="text-foreground">Blog</span>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <AnimatedSection>
                  {featuredArticle && (
                  <Card className="mb-8 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="grid md:grid-cols-2 gap-0">
                        <div className="aspect-square md:aspect-auto relative overflow-hidden">
                          <img
                            src={featuredArticle.imageUrl || "/placeholder.svg"}
                            alt={featuredArticle.title}
                            className="w-full h-full object-cover"
                          />
                          <Badge className="absolute top-4 left-4">FEATURED ARTICLE</Badge>
                        </div>
                        <div className="p-6 md:p-8 flex flex-col justify-center">
                          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4" data-testid="text-featured-title">
                            {featuredArticle.title}
                          </h2>
                          <p className="text-muted-foreground mb-6">
                            {featuredArticle.excerpt}
                          </p>
                          <Link href={`/blog/${featuredArticle.slug}`}>
                            <Button data-testid="button-read-featured">
                              Read Featured Article
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                </AnimatedSection>

                <AnimatedSection delay={0.1}>
                  <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <h2 className="text-2xl font-bold text-foreground" data-testid="text-latest-updates">Latest Updates</h2>
                      <p className="text-sm text-muted-foreground">Browse our archive of articles, study guides, and clinical notes.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mb-6">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Search articles..." className="pl-9" data-testid="input-search-articles" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                          <Button
                            key={cat}
                            variant={cat === "All" ? "default" : "outline"}
                            size="sm"
                            data-testid={`button-category-${cat.toLowerCase()}`}
                          >
                            {cat}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </AnimatedSection>

                <motion.div
                  className="grid sm:grid-cols-2 gap-6"
                  ref={articlesRef.ref}
                  initial={prefersReducedMotion ? false : "hidden"}
                  animate={articlesRef.isInView ? "visible" : "hidden"}
                  variants={staggerContainer}
                >
                  {articles.map((article, index) => (
                    <motion.div key={index} variants={fadeInUp}>
                      <Link href={`/blog/${article.slug}`}>
                        <Card className="h-full group cursor-pointer transition-all duration-300 hover:shadow-lg">
                          <CardContent className="p-0">
                            <div className="h-40 relative overflow-hidden">
                              <img
                                src={article.imageUrl || "/placeholder.svg"}
                                alt={article.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <Badge variant="secondary" className="absolute top-3 left-3 text-xs">{article.category}</Badge>
                            </div>
                            <div className="p-4">
                              <p className="text-xs text-muted-foreground mb-1">{article.createdAt ? new Date(article.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"} · {article.readTime}</p>
                              <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                {article.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{article.excerpt}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-3 h-3 text-primary" />
                                  </div>
                                  <span className="text-xs text-muted-foreground">{article.author}</span>
                                </div>
                                <span className="text-xs text-primary font-medium">Read More</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>

                <AnimatedSection delay={0.2} className="flex justify-center items-center gap-2 mt-8">
                  <Button variant="outline" size="icon" data-testid="button-prev-page">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {[1, 2, 3].map((page) => (
                    <Button
                      key={page}
                      variant={page === 1 ? "default" : "outline"}
                      size="sm"
                      data-testid={`button-page-${page}`}
                    >
                      {page}
                    </Button>
                  ))}
                  <span className="text-muted-foreground">...</span>
                  <Button variant="outline" size="sm" data-testid="button-page-8">8</Button>
                  <Button variant="outline" size="icon" data-testid="button-next-page">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </AnimatedSection>
              </div>

              <AnimatedSection delay={0.15} className="space-y-8">
                <Card className="bg-primary text-primary-foreground">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">Weekly Dose</h3>
                    <p className="text-sm text-primary-foreground/80 mb-4">
                      Join 50,000+ students receiving anatomy tips, mnemonics, and clinical correlations every week.
                    </p>
                    <Input
                      placeholder="Your email address"
                      className="mb-3 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      data-testid="input-newsletter-email"
                    />
                    <Button
                      variant="secondary"
                      className="w-full gap-2"
                      onClick={() => handleSubscribe(email)}
                      disabled={newsletterMutation.isPending}
                      data-testid="button-subscribe"
                    >
                      {newsletterMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Subscribing...
                        </>
                      ) : (
                        "Subscribe for Free"
                      )}
                    </Button>
                    <p className="text-xs text-primary-foreground/60 mt-3">No spam. Unsubscribe anytime.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Categories</h3>
                    <div className="space-y-3">
                      {Array.from(new Set(articles.map(a => a.category))).slice(0, 5).map((cat) => (
                        <div key={cat} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <Link href="/search" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            {cat}
                          </Link>
                          <span className="text-xs text-muted-foreground">{articles.filter(a => a.category === cat).length}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <motion.section
          className="py-16 md:py-24 bg-primary text-primary-foreground"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <AnimatedSection>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-blog-cta-title">
                Join 50,000+ Students
              </h2>
              <p className="text-primary-foreground/80 mb-8">
                Get weekly anatomy tips, clinical mnemonic cheat sheets, and 3D atlas updates delivered straight to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  placeholder="Enter your email address"
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  data-testid="input-footer-newsletter"
                />
                <Button
                  variant="secondary"
                  onClick={() => handleSubscribe(footerEmail)}
                  disabled={newsletterMutation.isPending}
                  className="gap-2"
                  data-testid="button-footer-subscribe"
                >
                  {newsletterMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    "Subscribe Free"
                  )}
                </Button>
              </div>
              <p className="text-xs text-primary-foreground/60 mt-3">No spam, unsubscribe at any time.</p>
            </AnimatedSection>
          </div>
        </motion.section>
      </PageTransition>
    </Layout>
  );
}
