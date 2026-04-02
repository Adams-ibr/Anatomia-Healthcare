import { useEffect, useRef, useState, useCallback, type MouseEvent } from "react";
import "@google/model-viewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, RotateCcw, ZoomIn, ZoomOut, Maximize2, Info, 
  Hand, Play, X, ChevronRight, ChevronLeft, Move3D
} from "lucide-react";
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
  cameraOrbit?: string;
}

interface TourStep {
  title: string;
  description: string;
  cameraOrbit?: string;
  highlightAnnotation?: number;
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
  enableClickSelection?: boolean;
  tourSteps?: TourStep[];
  onPartClick?: (position: { x: number; y: number; z: number }) => void;
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
  enableClickSelection = false,
  tourSteps = [],
  onPartClick,
}: ModelViewerProps) {
  const modelRef = useRef<HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [interactionMode, setInteractionMode] = useState<"rotate" | "pan">("rotate");
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [clickedPosition, setClickedPosition] = useState<{ x: number; y: number; z: number } | null>(null);

  useEffect(() => {
    const model = modelRef.current;
    if (model) {
      const handleLoad = () => setIsLoading(false);
      model.addEventListener("load", handleLoad);
      return () => model.removeEventListener("load", handleLoad);
    }
  }, []);

  const resetView = useCallback(() => {
    const model = modelRef.current as any;
    if (model) {
      model.cameraOrbit = "0deg 75deg 105%";
      model.fieldOfView = "45deg";
    }
  }, []);

  const zoom = useCallback((direction: "in" | "out") => {
    const model = modelRef.current as any;
    if (model) {
      const currentFov = parseFloat(model.fieldOfView) || 45;
      const newFov = direction === "in" ? Math.max(20, currentFov - 10) : Math.min(90, currentFov + 10);
      model.fieldOfView = `${newFov}deg`;
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = modelRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }, []);

  const toggleAutoRotate = useCallback(() => {
    const model = modelRef.current as any;
    if (model) {
      model.autoRotate = !model.autoRotate;
    }
  }, []);

  const setCameraOrbit = useCallback((orbit: string) => {
    const model = modelRef.current as any;
    if (model) {
      model.cameraOrbit = orbit;
    }
  }, []);

  const handleModelClick = useCallback((event: MouseEvent<HTMLElement>) => {
    if (!enableClickSelection) return;
    
    const model = modelRef.current as any;
    if (!model) return;

    const rect = model.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const hit = model.positionAndNormalFromPoint(x, y);
    if (hit) {
      setClickedPosition(hit.position);
      onPartClick?.(hit.position);
      
      const nearestAnnotation = annotations.find((ann) => {
        const dist = Math.sqrt(
          Math.pow(ann.position.x - hit.position.x, 2) +
          Math.pow(ann.position.y - hit.position.y, 2) +
          Math.pow(ann.position.z - hit.position.z, 2)
        );
        return dist < 0.1;
      });
      
      if (nearestAnnotation) {
        setSelectedAnnotation(nearestAnnotation);
        if (nearestAnnotation.cameraOrbit) {
          setCameraOrbit(nearestAnnotation.cameraOrbit);
        }
      }
    }
  }, [enableClickSelection, annotations, onPartClick, setCameraOrbit]);

  const startTour = useCallback(() => {
    setIsTourActive(true);
    setTourStep(0);
    toggleAutoRotate();
    if (tourSteps[0]?.cameraOrbit) {
      setCameraOrbit(tourSteps[0].cameraOrbit);
    }
  }, [tourSteps, setCameraOrbit, toggleAutoRotate]);

  const nextTourStep = useCallback(() => {
    if (tourStep < tourSteps.length - 1) {
      const nextStep = tourStep + 1;
      setTourStep(nextStep);
      if (tourSteps[nextStep]?.cameraOrbit) {
        setCameraOrbit(tourSteps[nextStep].cameraOrbit);
      }
    } else {
      setIsTourActive(false);
      setTourStep(0);
    }
  }, [tourStep, tourSteps, setCameraOrbit]);

  const prevTourStep = useCallback(() => {
    if (tourStep > 0) {
      const prevStep = tourStep - 1;
      setTourStep(prevStep);
      if (tourSteps[prevStep]?.cameraOrbit) {
        setCameraOrbit(tourSteps[prevStep].cameraOrbit);
      }
    }
  }, [tourStep, tourSteps, setCameraOrbit]);

  const endTour = useCallback(() => {
    setIsTourActive(false);
    setTourStep(0);
  }, []);

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
            touch-action={interactionMode === "pan" ? "pan-y" : "none"}
            onClick={handleModelClick}
            style={{
              width: "100%",
              height: "100%",
              minHeight: "300px",
              backgroundColor: "transparent",
              cursor: enableClickSelection ? "crosshair" : "grab",
            }}
          />

          {isTourActive && tourSteps.length > 0 && (
            <div className="absolute bottom-16 left-3 right-3 p-4 rounded-lg backdrop-blur-md bg-background/90 border shadow-lg z-20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  Step {tourStep + 1} of {tourSteps.length}
                </span>
                <Button size="icon" variant="ghost" onClick={endTour} className="h-6 w-6">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <h4 className="font-semibold mb-1">{tourSteps[tourStep]?.title}</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {tourSteps[tourStep]?.description}
              </p>
              <div className="flex justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={prevTourStep}
                  disabled={tourStep === 0}
                  data-testid="button-tour-prev"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  onClick={nextTourStep}
                  data-testid="button-tour-next"
                >
                  {tourStep === tourSteps.length - 1 ? "Finish" : "Next"}
                  {tourStep < tourSteps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </div>
          )}

          {selectedAnnotation && (
            <div className="absolute top-3 left-3 p-3 rounded-lg backdrop-blur-md bg-background/90 border max-w-[200px] z-20">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-sm">{selectedAnnotation.label}</h4>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setSelectedAnnotation(null)}
                  className="h-5 w-5"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {selectedAnnotation.description && (
                <p className="text-xs text-muted-foreground">{selectedAnnotation.description}</p>
              )}
            </div>
          )}

          {showControls && (
            <>
              <div className="absolute bottom-3 left-3 flex gap-1">
                {tourSteps.length > 0 && !isTourActive && (
                  <Button
                    size="sm"
                    onClick={startTour}
                    className="backdrop-blur-sm bg-primary/90 text-primary-foreground"
                    data-testid="button-start-tour"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Guided Tour
                  </Button>
                )}
              </div>

              <div className="absolute bottom-3 right-3 flex gap-1">
                {enableClickSelection && (
                  <Button
                    size="icon"
                    variant={interactionMode === "pan" ? "default" : "secondary"}
                    onClick={() => setInteractionMode(interactionMode === "rotate" ? "pan" : "rotate")}
                    className="backdrop-blur-sm bg-background/70"
                    data-testid="button-toggle-pan"
                    title={interactionMode === "rotate" ? "Switch to Pan" : "Switch to Rotate"}
                  >
                    {interactionMode === "rotate" ? <Hand className="h-4 w-4" /> : <Move3D className="h-4 w-4" />}
                  </Button>
                )}
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
            </>
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
                    Click on a part to learn more about it
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {annotations.map((annotation, idx) => (
                    <button
                      key={idx}
                      className="w-full p-3 rounded-md bg-muted text-left hover-elevate transition-colors"
                      onClick={() => {
                        setSelectedAnnotation(annotation);
                        if (annotation.cameraOrbit) {
                          setCameraOrbit(annotation.cameraOrbit);
                        }
                      }}
                    >
                      <h4 className="font-medium">{annotation.label}</h4>
                      {annotation.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {annotation.description}
                        </p>
                      )}
                    </button>
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
