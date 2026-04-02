import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Clock, 
  User,
  BookmarkPlus,
  Share2,
  ThumbsUp,
  MessageSquare,
  ChevronRight,
  Layers,
  AlertCircle
} from "lucide-react";

const tableOfContents = [
  "Introduction",
  "1. Roots",
  "2. Trunks",
  "3. Divisions",
  "4. Cords",
  "5. Branches"
];

const relatedArticles = [
  { category: "MUSCLES", title: "Muscles of the Anterior Compartment of the Arm" },
  { category: "BONES", title: "Carpal Bones: Mnemonics and Identification" },
  { category: "VASCULATURE", title: "The Axillary Artery: Parts and Branches" },
];

export default function SingleBlog() {
  return (
    <Layout>
      <section className="py-4 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/blog" className="hover:text-primary transition-colors">Musculoskeletal System</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Nerves</span>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">MUSCULOSKELETAL</Badge>
            <Badge variant="outline">NERVOUS SYSTEM</Badge>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="text-article-title">
            The Brachial Plexus: Anatomy and Function
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span>Dr. Sarah Jenkins</span>
              <Badge variant="outline" className="text-xs">Verified</Badge>
            </div>
            <span>Oct 24, 2023 · 8 min read</span>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-4 gap-8">
            <article className="lg:col-span-3">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg mb-8 flex items-center justify-center">
                <div className="text-center p-8">
                  <Layers className="w-16 h-16 text-primary/50 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Figure 1: Overview of the Brachial Plexus and its anatomical position relative to the clavicle</p>
                </div>
              </div>

              <div className="prose prose-lg max-w-none dark:prose-invert">
                <p className="lead text-lg text-muted-foreground mb-8">
                  The brachial plexus is a complex network of nerves formed by the anterior rami of the lower four cervical nerves (C5-C8) and the first thoracic nerve (T1). This plexus supplies afferent and efferent nerve fibers to the chest, shoulder, arm, forearm, and hand.
                </p>

                <p className="text-foreground mb-6">
                  Understanding the brachial plexus is a rite of passage for every medical student. While it can appear daunting at first, breaking it down into its five main components—roots, trunks, divisions, cords, and branches—makes the anatomy logical and easier to retain.
                </p>

                <Card className="bg-primary/5 border-primary/20 mb-8">
                  <CardContent className="p-6">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Clinical Relevance</h4>
                        <p className="text-sm text-muted-foreground">
                          Injuries to the brachial plexus can result in severe functional impairment. <strong>Erb's Palsy</strong> (injury to the upper trunk, C5-C6) typically presents with the "waiter's tip" deformity, while <strong>Klumpke's Palsy</strong> (injury to the lower trunk, C8-T1) affects the intrinsic hand muscles, leading to a "claw hand."
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <h2 className="text-2xl font-bold text-foreground mb-4">1. Roots</h2>
                <p className="text-foreground mb-6">
                  The "roots" of the brachial plexus are formed by the anterior rami of spinal nerves C5, C6, C7, C8, and T1. These roots emerge between the anterior and middle scalene muscles in the neck.
                </p>
                <ul className="list-disc list-inside text-foreground space-y-2 mb-8">
                  <li><strong>C5:</strong> Often receives a contribution from C4 (pre-fixed plexus).</li>
                  <li><strong>T1:</strong> Often receives a contribution from T2 (post-fixed plexus).</li>
                </ul>

                <h2 className="text-2xl font-bold text-foreground mb-4">2. Trunks</h2>
                <p className="text-foreground mb-6">
                  Shortly after emerging from the interscalene triangle, the five roots merge to form three trunks:
                </p>
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  {["Superior Trunk", "Middle Trunk", "Inferior Trunk"].map((trunk, i) => (
                    <Card key={trunk}>
                      <CardContent className="p-4 text-center">
                        <h4 className="font-semibold text-foreground">{trunk}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {i === 0 ? "Combination of C5 & C6" : i === 1 ? "Continuation of C7" : "Combination of C8 & T1"}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-4">3. Divisions</h2>
                <p className="text-foreground mb-8">
                  As the trunks pass posterior to the clavicle, each trunk splits into an anterior and a posterior division. This separation is functionally significant: anterior divisions supply flexor compartments of the upper limb (e.g., biceps, flexors of the forearm). Posterior divisions supply extensor compartments of the forearm.
                </p>
              </div>

              <div className="flex items-center gap-4 py-6 border-t border-b border-border">
                <Button variant="outline" size="sm" className="gap-2" data-testid="button-helpful">
                  <ThumbsUp className="w-4 h-4" />
                  Helpful (428)
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

              <div className="py-8">
                <h3 className="text-xl font-bold text-foreground mb-6">Discussion</h3>
                <div className="flex gap-3 mb-6">
                  <Textarea 
                    placeholder="Ask a question or share a clinical pearl..."
                    className="flex-1"
                    data-testid="input-comment"
                  />
                </div>
                <Button data-testid="button-post-comment">Post Comment</Button>

                <div className="space-y-6 mt-8">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">Michael Torres (Med Student)</span>
                            <span className="text-xs text-muted-foreground">3 days ago</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            The mnemonic "Read That Damn Cadaver Book" (Roots, Trunks, Divisions, Cords, Branches) saved my life during anatomy finals! Great article.
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> 42</span>
                            <span>Reply</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </article>

            <aside className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Contents
                  </h4>
                  <nav className="space-y-2">
                    {tableOfContents.map((item, index) => (
                      <a 
                        key={item} 
                        href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
                        className={`block text-sm ${index === 0 ? 'text-primary font-medium' : 'text-muted-foreground'} hover:text-primary transition-colors`}
                      >
                        {item}
                      </a>
                    ))}
                  </nav>
                </CardContent>
              </Card>

              <Card className="bg-primary/5">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    Quick Facts
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Origin</p>
                      <p className="text-foreground font-medium">Spinal roots C5, C6, C7, C8, T1</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="text-foreground font-medium">Posterior triangle of the neck & axilla</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Function</p>
                      <p className="text-foreground font-medium">Sensory and motor innervation of the upper limb</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Test your knowledge</h4>
                  <p className="text-sm text-primary-foreground/80 mb-4">
                    Ready to master the Brachial Plexus? Take our quiz on the upper limb nerves.
                  </p>
                  <Button variant="secondary" size="sm" className="w-full" data-testid="button-start-quiz">
                    Start Quiz
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </section>

      <section className="py-12 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h3 className="text-xl font-bold text-foreground mb-6">Related Articles</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedArticles.map((article) => (
              <Link key={article.title} href="/blog/article">
                <Card className="h-full cursor-pointer transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-0">
                    <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5" />
                    <div className="p-4">
                      <Badge variant="secondary" className="mb-2 text-xs">{article.category}</Badge>
                      <h4 className="font-semibold text-foreground">{article.title}</h4>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
