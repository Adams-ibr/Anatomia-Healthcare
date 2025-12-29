import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Search as SearchIcon,
  X,
  Clock,
  Eye,
  BookOpen,
  HelpCircle,
  Box,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles
} from "lucide-react";

const regions = [
  { id: "upper-limb", label: "Upper Limb", checked: true },
  { id: "head-neck", label: "Head & Neck", checked: false },
  { id: "thorax", label: "Thorax", checked: false },
  { id: "abdomen", label: "Abdomen", checked: false },
];

const contentTypes = [
  { id: "articles", label: "Articles", checked: true },
  { id: "3d-models", label: "3D Models", checked: false },
  { id: "quizzes", label: "Quizzes", checked: false },
];

const searchResults = [
  {
    category: "UPPER LIMB",
    subcategory: "Nerves",
    title: "The Brachial Plexus",
    description: "The brachial plexus is a somatic nerve plexus formed by intercommunications among the ventral rami (roots) of the lower 4 cervical nerves (C5-C8) and the first thoracic nerve (T1). It is responsible for...",
    readTime: "8 min read",
    views: "12.5k views",
    badge: "UPPER LIMB",
    badgeColor: "bg-blue-500"
  },
  {
    category: "QUIZ",
    subcategory: "Neuroanatomy",
    title: "Brachial Plexus: Roots & Trunks",
    description: "Test your knowledge on the formation of the brachial plexus. This quiz covers the roots, trunks, divisions, cords, and branches, focusing on clinical correlations like Erb's Palsy.",
    questions: "15 Questions",
    difficulty: "Intermediate",
    badge: "QUIZ",
    badgeColor: "bg-purple-500"
  },
  {
    category: "3D MODEL",
    subcategory: "Interactive",
    title: "Interactive 3D: Axilla & Plexus",
    description: "Explore the spatial relationship between the brachial plexus, axillary artery, and surrounding musculature in a fully rotatable 3D environment.",
    access: "Free Access",
    badge: "3D MODEL",
    badgeColor: "bg-green-500"
  },
  {
    category: "MUSCULOSKELETAL",
    subcategory: "Muscles",
    title: "Muscles of the Anterior Arm",
    description: "Detailed breakdown of the Biceps Brachii, Coracobrachialis, and Brachialis. Includes innervation by the Musculocutaneous nerve (from Brachial Plexus).",
    readTime: "5 min read",
    views: "8k views",
    badge: "MUSCULOSKELETAL",
    badgeColor: "bg-orange-500"
  },
  {
    category: "CLINICAL",
    subcategory: "Pathology",
    title: "Erb's Palsy & Klumpke's Palsy",
    description: "Clinical conditions resulting from injury to the roots of the brachial plexus. Includes mechanism of injury, clinical presentation (Waiter's tip position), and management.",
    readTime: "6 min read",
    views: "5.2k views",
    badge: "CLINICAL",
    badgeColor: "bg-red-500"
  },
];

export default function Search() {
  return (
    <Layout>
      <section className="py-4 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Search Results</span>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative mb-4">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              defaultValue="Brachial Plexus"
              className="pl-12 pr-12 h-14 text-lg"
              data-testid="input-search-main"
            />
            <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Did you mean:</span>
            <Link href="/search" className="text-primary hover:underline flex items-center gap-1">
              Brachial Plexus Nerves
              <Sparkles className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-4 gap-8">
            <aside className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Filters</h3>
                    <Button variant="ghost" size="sm" className="text-primary" data-testid="button-reset-filters">
                      Reset
                    </Button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">REGION</h4>
                      <div className="space-y-2">
                        {regions.map((region) => (
                          <div key={region.id} className="flex items-center gap-2">
                            <Checkbox 
                              id={region.id} 
                              defaultChecked={region.checked}
                              data-testid={`checkbox-${region.id}`}
                            />
                            <Label htmlFor={region.id} className="text-sm">{region.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">CONTENT TYPE</h4>
                      <div className="space-y-2">
                        {contentTypes.map((type) => (
                          <div key={type.id} className="flex items-center gap-2">
                            <Checkbox 
                              id={type.id} 
                              defaultChecked={type.checked}
                              data-testid={`checkbox-${type.id}`}
                            />
                            <Label htmlFor={type.id} className="text-sm">{type.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Go Pro</h3>
                  <p className="text-sm text-primary-foreground/80 mb-4">
                    Get access to 3D models and ad-free browsing.
                  </p>
                  <Button variant="secondary" size="sm" className="w-full" data-testid="button-upgrade">
                    Upgrade Now
                  </Button>
                </CardContent>
              </Card>
            </aside>

            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground" data-testid="text-results-title">
                  Results for "Brachial Plexus"
                </h2>
                <Badge variant="outline">{searchResults.length} results found</Badge>
              </div>

              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <Link key={index} href="/blog/article">
                    <Card className="group cursor-pointer transition-all duration-300 hover:shadow-md">
                      <CardContent className="p-0">
                        <div className="flex gap-4 p-4">
                          <div className="w-24 h-24 shrink-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center relative">
                            <Badge 
                              className={`absolute top-1 right-1 text-[10px] px-1 py-0 ${result.badgeColor} text-white`}
                            >
                              {result.badge.substring(0, 1)}
                            </Badge>
                            <Layers className="w-8 h-8 text-primary/30" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">{result.category}</Badge>
                              <span className="text-xs text-muted-foreground">{result.subcategory}</span>
                            </div>
                            <h3 className="font-semibold text-primary group-hover:underline mb-2">
                              {result.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {result.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {result.readTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {result.readTime}
                                </span>
                              )}
                              {result.views && (
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> {result.views}
                                </span>
                              )}
                              {result.questions && (
                                <span className="flex items-center gap-1">
                                  <HelpCircle className="w-3 h-3" /> {result.questions}
                                </span>
                              )}
                              {result.difficulty && (
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" /> {result.difficulty}
                                </span>
                              )}
                              {result.access && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <Box className="w-3 h-3" /> {result.access}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              <div className="flex justify-center items-center gap-2 mt-8">
                <Button variant="outline" size="icon" data-testid="button-prev">
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
                <Button variant="outline" size="icon" data-testid="button-next">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
