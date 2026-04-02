import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Search, Filter, Maximize2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { GalleryItem } from "@shared/schema";

const CATEGORIES = ["All", "Anatomy", "Surgical", "Radiology", "Histology", "Pathology"];

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  const { data: items = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ["/api/gallery"],
  });

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Medical Illustration Gallery
            </motion.h1>
            <motion.p 
              className="text-lg text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Explore our curated collection of high-precision medical illustrations and clinical imagery designed for education and research.
            </motion.p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-10">
            <div className="flex flex-wrap gap-2 justify-center">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="rounded-full px-6"
                >
                  {cat}
                </Button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search gallery..."
                className="w-full pl-10 pr-4 py-2 rounded-full border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Gallery Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 border rounded-3xl bg-card/50">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              layout
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card 
                      className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-card"
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="aspect-[4/3] relative overflow-hidden">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30">
                            <Maximize2 className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <Badge className="absolute top-3 left-3 bg-white/90 text-black hover:bg-white transition-colors">
                          {item.category}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-black/95 border-none">
          <DialogHeader className="absolute top-4 left-6 z-10 text-white pointer-events-none">
            <DialogTitle className="text-2xl font-bold bg-black/20 backdrop-blur-sm p-2 rounded px-4">
              {selectedItem?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="relative flex items-center justify-center min-h-[60vh] max-h-[85vh]">
            {selectedItem && (
              <img 
                src={selectedItem.imageUrl} 
                alt={selectedItem.title} 
                className="max-w-full max-h-[85vh] object-contain"
              />
            )}
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
              onClick={() => setSelectedItem(null)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          {selectedItem?.description && (
            <div className="p-6 bg-card text-card-foreground">
              <Badge className="mb-3">{selectedItem.category}</Badge>
              <p className="text-lg leading-relaxed">
                {selectedItem.description}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
