import { useEffect, useRef, useState } from "react";
import "@google/model-viewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RotateCcw, ZoomIn, ZoomOut, Maximize2, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Annotation {
  position: { x: number; y: number; z: number };
  label: string;
  description?: string;
}

interface ModelViewerProps {
  src: string;
  alt?: string;
  title?: string;
  description?: string;
  poster?: string;
  annotations?: Annotation[];
  tags?: string[];
  className?: string;
  showControls?: boolean;
  autoRotate?: boolean;
}

export function ModelViewer({
  src,
  alt = "3D Model",
  title,
  description,
  poster,
  annotations = [],
  tags = [],
  className = "",
  showControls = true,
  autoRotate = true,
}: ModelViewerProps) {
  const modelRef = useRef<HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);

  useEffect(() => {
    const model = modelRef.current;
    if (model) {
      const handleLoad = () => setIsLoading(false);
      model.addEventListener("load", handleLoad);
      return () => model.removeEventListener("load", handleLoad);
    }
  }, []);

  const resetView = () => {
    const model = modelRef.current as any;
    if (model) {
      model.cameraOrbit = "0deg 75deg 105%";
      model.fieldOfView = "45deg";
    }
  };

  const zoom = (direction: "in" | "out") => {
    const model = modelRef.current as any;
    if (model) {
      const currentFov = parseFloat(model.fieldOfView) || 45;
      const newFov = direction === "in" ? Math.max(20, currentFov - 10) : Math.min(90, currentFov + 10);
      model.fieldOfView = `${newFov}deg`;
    }
  };

  const toggleFullscreen = () => {
    const container = modelRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const toggleAutoRotate = () => {
    const model = modelRef.current as any;
    if (model) {
      model.autoRotate = !model.autoRotate;
    }
  };

  return (
    <Card className={`overflow-visible ${className}`}>
      {title && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-lg">{title}</CardTitle>
            {tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent className="p-0 relative">
        <div className="relative aspect-square rounded-md overflow-hidden bg-muted">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <model-viewer
            ref={modelRef as any}
            src={src}
            alt={alt}
            poster={poster}
            camera-controls
            auto-rotate={autoRotate}
            shadow-intensity="1"
            exposure="0.8"
            interaction-prompt="auto"
            loading="eager"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "300px",
              backgroundColor: "transparent",
            }}
          />

          {showControls && (
            <div className="absolute bottom-3 right-3 flex gap-1">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => zoom("in")}
                className="backdrop-blur-sm bg-background/70"
                data-testid="button-zoom-in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => zoom("out")}
                className="backdrop-blur-sm bg-background/70"
                data-testid="button-zoom-out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={resetView}
                className="backdrop-blur-sm bg-background/70"
                data-testid="button-reset-view"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={toggleFullscreen}
                className="backdrop-blur-sm bg-background/70"
                data-testid="button-fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {annotations.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-3 right-3 backdrop-blur-sm bg-background/70"
                  data-testid="button-annotations"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Annotations</DialogTitle>
                  <DialogDescription>
                    Learn about the different parts of this model
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {annotations.map((annotation, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-md bg-muted"
                    >
                      <h4 className="font-medium">{annotation.label}</h4>
                      {annotation.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {annotation.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
