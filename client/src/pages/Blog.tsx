import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Clock, 
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import armImg from "@assets/stock_images/human_arm_muscles_an_9d7db348.jpg";
import brainImg from "@assets/stock_images/human_brain_anatomy__282b70de.jpg";
import heartImg from "@assets/stock_images/human_heart_anatomy__701f24b0.jpg";
import spineImg from "@assets/stock_images/human_spine_vertebra_b5200c9c.jpg";
import torsoImg from "@assets/stock_images/human_torso_chest_an_152c69d9.jpg";
import skeletonImg from "@assets/stock_images/human_skeleton_medic_56e01afd.jpg";

const categories = ["All", "Musculoskeletal", "Neuroanatomy", "Visceral", "Clinical Case"];

const popularTopics = [
  { name: "Cranial Nerves", count: 12 },
  { name: "Brachial Plexus", count: 9 },
  { name: "Cardiac Cycle", count: 18 },
  { name: "Lower Limb Muscles", count: 25 },
];

const articles = [
  {
    category: "NEUROANATOMY",
    title: "Understanding the Circle of Willis: A...",
    excerpt: "A comprehensive look at the arterial blood supply of the brain, its anastomoses, structure, and clinical...",
    author: "Dr. Sarah Chen",
    readTime: "8 min read",
    date: "Oct 24, 2023",
    image: brainImg
  },
  {
    category: "STUDY TIPS",
    title: "5 Mnemonics for Cranial Nerves You Won't...",
    excerpt: "Memorize the 12 cranial nerves faster with these student-approved memory aids and mnemonic devices...",
    author: "James Victor",
    readTime: "5 min read",
    date: "Oct 20, 2023",
    image: skeletonImg
  },
  {
    category: "MUSCULOSKELETAL",
    title: "Carpal Bones: Anatomy, Attachments & Clinical...",
    excerpt: "A deep dive into the 8 carpal bones of the wrist, including the flexor retinaculum attachments and carpal...",
    author: "Dr. Sarah Chen",
    readTime: "7 min read",
    date: "Oct 18, 2023",
    image: armImg
  },
  {
    category: "CARDIOLOGY",
    title: "Cardiac Valves: Structure and Function",
    excerpt: "Exploring the mitral, tricuspid, aortic, and pulmonary valves. Understand diastolic/systolic points and...",
    author: "Dr. Peter Rodriguez",
    readTime: "10 min read",
    date: "Oct 15, 2023",
    image: heartImg
  },
  {
    category: "CASE STUDIES",
    title: "Case Study: Lumbar Herniation and Sciatica",
    excerpt: "A clinical presentation walkthrough through a patient presentation of L5-S1 disc herniation, sensory...",
    author: "Dr. Big Patel",
    readTime: "12 min read",
    date: "Sep 08, 2023",
    image: spineImg
  },
  {
    category: "PATHOLOGY",
    title: "Pneumonia vs. Pneumothorax...",
    excerpt: "Two X-differentiating common lung pathologies on a standard chest X-ray. Key visual markers and...",
    author: "Dr. James Victor",
    readTime: "7 min read",
    date: "Sep 25, 2023",
    image: torsoImg
  },
];

export default function Blog() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [footerEmail, setFooterEmail] = useState("");

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
              <Card className="mb-8 overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="aspect-square md:aspect-auto relative overflow-hidden">
                      <img 
                        src={armImg} 
                        alt="Brachial Plexus" 
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-4 left-4">FEATURED ARTICLE</Badge>
                    </div>
                    <div className="p-6 md:p-8 flex flex-col justify-center">
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4" data-testid="text-featured-title">
                        The Brachial Plexus: A Simplified Guide to Nerve Roots
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        Master the complex network of nerves supplying the upper limb with our step-by-step breakdowns, clinical correlations, and simplified diagrams designed for students.
                      </p>
                      <Link href="/blog/brachial-plexus">
                        <Button data-testid="button-read-featured">
                          Read Featured Article
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

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

              <div className="grid sm:grid-cols-2 gap-6">
                {articles.map((article, index) => (
                  <Link key={index} href="/blog/article">
                    <Card className="h-full group cursor-pointer transition-all duration-300 hover:shadow-lg">
                      <CardContent className="p-0">
                        <div className="h-40 relative overflow-hidden">
                          <img 
                            src={article.image} 
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <Badge variant="secondary" className="absolute top-3 left-3 text-xs">{article.category}</Badge>
                        </div>
                        <div className="p-4">
                          <p className="text-xs text-muted-foreground mb-1">{article.date} · {article.readTime}</p>
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
                ))}
              </div>

              <div className="flex justify-center items-center gap-2 mt-8">
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
              </div>
            </div>

            <div className="space-y-8">
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
                  <h3 className="font-semibold text-foreground mb-4">Popular Topics</h3>
                  <div className="space-y-3">
                    {popularTopics.map((topic) => (
                      <div key={topic.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <Link href="/search" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                          {topic.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">{topic.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
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
        </div>
      </section>
    </Layout>
  );
}
