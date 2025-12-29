import { useState, useMemo } from "react";
import { Link, useSearch, useLocation } from "wouter";
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
  Sparkles,
  SearchX
} from "lucide-react";

const regions = [
  { id: "upper-limb", label: "Upper Limb" },
  { id: "head-neck", label: "Head & Neck" },
  { id: "thorax", label: "Thorax" },
  { id: "abdomen", label: "Abdomen" },
  { id: "lower-limb", label: "Lower Limb" },
];

const contentTypes = [
  { id: "articles", label: "Articles" },
  { id: "3d-models", label: "3D Models" },
  { id: "quizzes", label: "Quizzes" },
];

const allResults = [
  {
    category: "UPPER LIMB",
    subcategory: "Nerves",
    title: "The Brachial Plexus",
    description: "The brachial plexus is a somatic nerve plexus formed by intercommunications among the ventral rami (roots) of the lower 4 cervical nerves (C5-C8) and the first thoracic nerve (T1). It is responsible for...",
    readTime: "8 min read",
    views: "12.5k views",
    badge: "UPPER LIMB",
    badgeColor: "bg-blue-500",
    keywords: ["brachial", "plexus", "nerves", "upper limb", "arm", "cervical"]
  },
  {
    category: "QUIZ",
    subcategory: "Neuroanatomy",
    title: "Brachial Plexus: Roots & Trunks",
    description: "Test your knowledge on the formation of the brachial plexus. This quiz covers the roots, trunks, divisions, cords, and branches, focusing on clinical correlations like Erb's Palsy.",
    questions: "15 Questions",
    difficulty: "Intermediate",
    badge: "QUIZ",
    badgeColor: "bg-purple-500",
    keywords: ["brachial", "plexus", "quiz", "roots", "trunks", "erb"]
  },
  {
    category: "3D MODEL",
    subcategory: "Interactive",
    title: "Interactive 3D: Axilla & Plexus",
    description: "Explore the spatial relationship between the brachial plexus, axillary artery, and surrounding musculature in a fully rotatable 3D environment.",
    access: "Free Access",
    badge: "3D MODEL",
    badgeColor: "bg-green-500",
    keywords: ["3d", "model", "axilla", "plexus", "brachial", "interactive"]
  },
  {
    category: "MUSCULOSKELETAL",
    subcategory: "Muscles",
    title: "Muscles of the Anterior Arm",
    description: "Detailed breakdown of the Biceps Brachii, Coracobrachialis, and Brachialis. Includes innervation by the Musculocutaneous nerve (from Brachial Plexus).",
    readTime: "5 min read",
    views: "8k views",
    badge: "MUSCULOSKELETAL",
    badgeColor: "bg-orange-500",
    keywords: ["muscles", "arm", "biceps", "brachii", "anterior", "upper limb"]
  },
  {
    category: "CLINICAL",
    subcategory: "Pathology",
    title: "Erb's Palsy & Klumpke's Palsy",
    description: "Clinical conditions resulting from injury to the roots of the brachial plexus. Includes mechanism of injury, clinical presentation (Waiter's tip position), and management.",
    readTime: "6 min read",
    views: "5.2k views",
    badge: "CLINICAL",
    badgeColor: "bg-red-500",
    keywords: ["erb", "klumpke", "palsy", "clinical", "brachial", "plexus", "injury"]
  },
  {
    category: "HEAD & NECK",
    subcategory: "Anatomy",
    title: "Cranial Nerves Overview",
    description: "A comprehensive guide to all 12 cranial nerves, their origins, pathways, and clinical significance. Essential for medical students and professionals.",
    readTime: "12 min read",
    views: "25k views",
    badge: "HEAD & NECK",
    badgeColor: "bg-teal-500",
    keywords: ["cranial", "nerves", "head", "neck", "brain", "facial"]
  },
  {
    category: "THORAX",
    subcategory: "Cardiovascular",
    title: "Heart Anatomy and Blood Flow",
    description: "Detailed exploration of cardiac anatomy including chambers, valves, coronary circulation, and the conduction system.",
    readTime: "10 min read",
    views: "18k views",
    badge: "THORAX",
    badgeColor: "bg-pink-500",
    keywords: ["heart", "cardiac", "thorax", "cardiovascular", "blood", "circulation"]
  },
  {
    category: "ABDOMEN",
    subcategory: "Digestive",
    title: "Gastrointestinal Tract Anatomy",
    description: "From esophagus to rectum - complete anatomical overview of the digestive system including blood supply and innervation.",
    readTime: "15 min read",
    views: "14k views",
    badge: "ABDOMEN",
    badgeColor: "bg-amber-500",
    keywords: ["gi", "gastrointestinal", "abdomen", "digestive", "stomach", "intestine"]
  },
  {
    category: "LOWER LIMB",
    subcategory: "Muscles",
    title: "Muscles of the Thigh",
    description: "Comprehensive study of the anterior, medial, and posterior compartments of the thigh including attachments, actions, and innervation.",
    readTime: "9 min read",
    views: "11k views",
    badge: "LOWER LIMB",
    badgeColor: "bg-indigo-500",
    keywords: ["thigh", "leg", "muscles", "lower limb", "quadriceps", "hamstring"]
  },
  {
    category: "3D MODEL",
    subcategory: "Skeletal",
    title: "Interactive 3D: Human Skeleton",
    description: "Explore every bone in the human body with this interactive 3D model. Rotate, zoom, and click for detailed information.",
    access: "Free Access",
    badge: "3D MODEL",
    badgeColor: "bg-green-500",
    keywords: ["skeleton", "bones", "3d", "model", "interactive", "skeletal"]
  },
];

export default function Search() {
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(searchString);
  const initialQuery = params.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const filteredResults = useMemo(() => {
    let results = allResults;

    if (query.trim()) {
      const searchTerms = query.toLowerCase().split(/\s+/);
      results = results.filter(result => {
        const searchableText = [
          result.title,
          result.description,
          result.category,
          result.subcategory,
          ...result.keywords
        ].join(" ").toLowerCase();
        
        return searchTerms.some(term => searchableText.includes(term));
      });
    }

    if (selectedRegions.length > 0) {
      results = results.filter(result => {
        const regionMap: Record<string, string[]> = {
          "upper-limb": ["UPPER LIMB", "MUSCULOSKELETAL"],
          "head-neck": ["HEAD & NECK"],
          "thorax": ["THORAX"],
          "abdomen": ["ABDOMEN"],
          "lower-limb": ["LOWER LIMB"],
        };
        return selectedRegions.some(region => 
          regionMap[region]?.includes(result.category)
        );
      });
    }

    if (selectedTypes.length > 0) {
      results = results.filter(result => {
        const typeMap: Record<string, string[]> = {
          "articles": ["UPPER LIMB", "HEAD & NECK", "THORAX", "ABDOMEN", "LOWER LIMB", "MUSCULOSKELETAL", "CLINICAL"],
          "3d-models": ["3D MODEL"],
          "quizzes": ["QUIZ"],
        };
        return selectedTypes.some(type => 
          typeMap[type]?.includes(result.category)
        );
      });
    }

    return results;
  }, [query, selectedRegions, selectedTypes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setLocation(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setLocation("/search");
  };

  const toggleRegion = (regionId: string) => {
    setSelectedRegions(prev => 
      prev.includes(regionId) 
        ? prev.filter(r => r !== regionId)
        : [...prev, regionId]
    );
  };

  const toggleType = (typeId: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const resetFilters = () => {
    setSelectedRegions([]);
    setSelectedTypes([]);
  };

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
          <form onSubmit={handleSearch} className="relative mb-4">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search anatomy topics, articles, quizzes..."
              className="pl-12 pr-12 h-14 text-lg"
              data-testid="input-search-main"
            />
            {query && (
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={clearSearch}
                data-testid="button-clear-search"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </form>
          {query && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Did you mean:</span>
              <Link href={`/search?q=${encodeURIComponent(query + " anatomy")}`} className="text-primary hover:underline flex items-center gap-1">
                {query} anatomy
                <Sparkles className="w-3 h-3" />
              </Link>
            </div>
          )}
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary" 
                      onClick={resetFilters}
                      data-testid="button-reset-filters"
                    >
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
                              checked={selectedRegions.includes(region.id)}
                              onCheckedChange={() => toggleRegion(region.id)}
                              data-testid={`checkbox-${region.id}`}
                            />
                            <Label htmlFor={region.id} className="text-sm cursor-pointer">{region.label}</Label>
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
                              checked={selectedTypes.includes(type.id)}
                              onCheckedChange={() => toggleType(type.id)}
                              data-testid={`checkbox-${type.id}`}
                            />
                            <Label htmlFor={type.id} className="text-sm cursor-pointer">{type.label}</Label>
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
                  {query ? `Results for "${query}"` : "All Results"}
                </h2>
                <Badge variant="outline">{filteredResults.length} results found</Badge>
              </div>

              {filteredResults.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <SearchX className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search terms or filters to find what you're looking for.
                    </p>
                    <Button variant="outline" onClick={() => { clearSearch(); resetFilters(); }} data-testid="button-clear-all">
                      Clear search and filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredResults.map((result, index) => (
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
              )}

              {filteredResults.length > 0 && (
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
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
