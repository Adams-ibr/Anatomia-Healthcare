import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ModelViewer } from "@/components/ModelViewer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Box, ChevronLeft, Filter } from "lucide-react";
import type { AnatomyModel } from "@shared/schema";

const BODY_SYSTEMS = [
  "All Systems",
  "Skeletal",
  "Muscular",
  "Cardiovascular",
  "Nervous",
  "Respiratory",
  "Digestive",
  "Endocrine",
  "Lymphatic",
  "Integumentary",
  "Urinary",
  "Reproductive",
];

const CATEGORIES = [
  "All Categories",
  "Bones",
  "Muscles",
  "Organs",
  "Vessels",
  "Nerves",
  "Joints",
  "Full Body",
];

export default function Anatomy3DViewer() {
  const [selectedModel, setSelectedModel] = useState<AnatomyModel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [bodySystemFilter, setBodySystemFilter] = useState("All Systems");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [showFilters, setShowFilters] = useState(false);

  const { data: models = [], isLoading } = useQuery<AnatomyModel[]>({
    queryKey: ["/api/lms/anatomy-models"],
  });

  const filteredModels = models.filter((model) => {
    const matchesSearch =
      !searchQuery ||
      model.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBodySystem =
      bodySystemFilter === "All Systems" ||
      model.bodySystem?.toLowerCase() === bodySystemFilter.toLowerCase();

    const matchesCategory =
      categoryFilter === "All Categories" ||
      model.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesBodySystem && matchesCategory;
  });

  if (selectedModel) {
    return (
      <div className="container mx-auto py-8 px-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedModel(null)}
              className="mb-6"
              data-testid="button-back-to-models"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Models
            </Button>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <ModelViewer
                  src={selectedModel.modelUrl}
                  title={selectedModel.title}
                  description={selectedModel.description || ""}
                  tags={selectedModel.tags || []}
                  annotations={(selectedModel.annotations as any) || []}
                  showControls
                  autoRotate
                  className="h-full"
                />
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedModel.title}</CardTitle>
                    <CardDescription>
                      {selectedModel.bodySystem && (
                        <Badge variant="secondary" className="mr-2">
                          {selectedModel.bodySystem}
                        </Badge>
                      )}
                      <Badge variant="outline">{selectedModel.category}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedModel.description && (
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedModel.description}
                        </p>
                      </div>
                    )}

                    {selectedModel.tags && selectedModel.tags.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedModel.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Rotate: Click and drag</p>
                    <p>Zoom: Scroll or pinch</p>
                    <p>Pan: Right-click and drag</p>
                  </CardContent>
                </Card>
              </div>
            </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Box className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">3D Anatomy Models</h1>
              </div>
              <p className="text-muted-foreground">
                Explore interactive 3D models of the human body. Rotate, zoom, and examine
                anatomical structures in detail.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-models"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="button-toggle-filters"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {showFilters && (
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Body System</label>
                  <Select value={bodySystemFilter} onValueChange={setBodySystemFilter}>
                    <SelectTrigger data-testid="select-body-system">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BODY_SYSTEMS.map((system) => (
                        <SelectItem key={system} value={system}>
                          {system}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  className="self-end"
                  onClick={() => {
                    setBodySystemFilter("All Systems");
                    setCategoryFilter("All Categories");
                    setSearchQuery("");
                  }}
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="aspect-square" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredModels.length === 0 ? (
              <Card className="p-12 text-center">
                <Box className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No models found</h3>
                <p className="text-muted-foreground mb-4">
                  {models.length === 0
                    ? "No 3D anatomy models are available yet. Check back later."
                    : "Try adjusting your search or filters."}
                </p>
                {models.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBodySystemFilter("All Systems");
                      setCategoryFilter("All Categories");
                      setSearchQuery("");
                    }}
                    data-testid="button-reset-filters"
                  >
                    Reset Filters
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredModels.map((model) => (
                  <Card
                    key={model.id}
                    className="cursor-pointer hover-elevate overflow-visible"
                    onClick={() => setSelectedModel(model)}
                    data-testid={`card-model-${model.id}`}
                  >
                    <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
                      {model.thumbnailUrl ? (
                        <img
                          src={model.thumbnailUrl}
                          alt={model.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Box className="h-16 w-16 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-1 line-clamp-1">{model.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {model.bodySystem && (
                          <Badge variant="secondary" className="text-xs">
                            {model.bodySystem}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {model.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
    </div>
  );
}
