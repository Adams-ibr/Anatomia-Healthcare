import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  RotateCcw, 
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Layers,
  Clock,
  CheckCircle2,
  Loader2
} from "lucide-react";
import type { FlashcardDeck, Flashcard } from "@shared/schema";

interface FlashcardWithProgress extends Flashcard {
  progress?: {
    masteryLevel: number;
    interval: number;
    nextReviewAt: Date | null;
    reviewCount: number;
  };
}

interface DeckWithCards extends FlashcardDeck {
  flashcards: Flashcard[];
}

export default function FlashcardStudy() {
  const [selectedDeck, setSelectedDeck] = useState<DeckWithCards | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState<"browse" | "spaced">("browse");
  const [studySession, setStudySession] = useState<{
    cards: FlashcardWithProgress[];
    reviewed: number;
    correct: number;
    startTime: Date;
  } | null>(null);

  const { data: decks = [], isLoading: decksLoading } = useQuery<FlashcardDeck[]>({
    queryKey: ["/api/lms/flashcard-decks"],
    queryFn: async () => {
      const res = await fetch("/api/lms/flashcard-decks");
      return res.json();
    },
  });

  const { data: dueCards = [], isLoading: dueLoading, refetch: refetchDue } = useQuery<FlashcardWithProgress[]>({
    queryKey: ["/api/lms/flashcard-decks", selectedDeck?.id, "due"],
    queryFn: async () => {
      if (!selectedDeck) return [];
      const res = await fetch(`/api/lms/flashcard-decks/${selectedDeck.id}/due`);
      return res.json();
    },
    enabled: !!selectedDeck && studyMode === "spaced",
  });

  const reviewMutation = useMutation({
    mutationFn: ({ flashcardId, quality }: { flashcardId: string; quality: number }) =>
      apiRequest(`/api/lms/flashcards/${flashcardId}/review`, "POST", { quality }),
    onSuccess: () => {
      if (studySession) {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= studySession.cards.length) {
          refetchDue();
        } else {
          setCurrentIndex(nextIndex);
          setIsFlipped(false);
        }
      }
    },
  });

  const selectDeck = async (deck: FlashcardDeck) => {
    try {
      const res = await fetch(`/api/lms/flashcard-decks/${deck.id}`);
      const fullDeck: DeckWithCards = await res.json();
      setSelectedDeck(fullDeck);
      setCurrentIndex(0);
      setIsFlipped(false);
      setStudySession(null);
    } catch (error) {
      console.error("Failed to load deck:", error);
    }
  };

  const startBrowseMode = () => {
    if (!selectedDeck) return;
    setStudyMode("browse");
    setStudySession({
      cards: selectedDeck.flashcards as FlashcardWithProgress[],
      reviewed: 0,
      correct: 0,
      startTime: new Date(),
    });
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const startSpacedMode = () => {
    if (!selectedDeck) return;
    setStudyMode("spaced");
    if (dueCards.length > 0) {
      setStudySession({
        cards: dueCards,
        reviewed: 0,
        correct: 0,
        startTime: new Date(),
      });
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  };

  const handleResponse = (quality: number) => {
    if (!studySession || !studySession.cards[currentIndex]) return;
    
    const card = studySession.cards[currentIndex];
    reviewMutation.mutate({ flashcardId: card.id, quality });
    
    setStudySession({
      ...studySession,
      reviewed: studySession.reviewed + 1,
      correct: quality >= 3 ? studySession.correct + 1 : studySession.correct,
    });
  };

  const navigateCard = (direction: "prev" | "next") => {
    if (!studySession) return;
    if (direction === "prev" && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    } else if (direction === "next" && currentIndex < studySession.cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const resetStudy = () => {
    setSelectedDeck(null);
    setStudySession(null);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const getMasteryColor = (level: number) => {
    if (level >= 4) return "bg-green-500";
    if (level >= 2) return "bg-yellow-500";
    return "bg-red-500";
  };

  const currentCard = studySession?.cards[currentIndex];
  const isSessionComplete = studySession && currentIndex >= studySession.cards.length;

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Flashcards</h1>
              <p className="text-muted-foreground">
                Study with spaced repetition for optimal retention.
              </p>
            </div>
            {selectedDeck && (
              <Button variant="outline" onClick={resetStudy}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Decks
              </Button>
            )}
          </div>

          {!selectedDeck ? (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Available Decks</h2>
              {decksLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : decks.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No flashcard decks available yet.</p>
                    <p className="text-sm">Check back later for new study materials.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {decks.map((deck) => (
                    <Card 
                      key={deck.id} 
                      className="cursor-pointer hover-elevate"
                      onClick={() => selectDeck(deck)}
                      data-testid={`card-deck-${deck.id}`}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Layers className="w-5 h-5 text-primary" />
                          {deck.title}
                        </CardTitle>
                        {deck.description && (
                          <CardDescription className="line-clamp-2">
                            {deck.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : !studySession ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  {selectedDeck.title}
                </CardTitle>
                {selectedDeck.description && (
                  <CardDescription>{selectedDeck.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 text-center">
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-3xl font-bold">{selectedDeck.flashcards.length}</div>
                    <div className="text-sm text-muted-foreground">Total Cards</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-3xl font-bold">{dueLoading ? "..." : dueCards.length}</div>
                    <div className="text-sm text-muted-foreground">Due for Review</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Choose Study Mode</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card 
                      className="cursor-pointer hover-elevate"
                      onClick={startBrowseMode}
                      data-testid="button-browse-mode"
                    >
                      <CardContent className="pt-6 text-center">
                        <Eye className="w-8 h-8 mx-auto mb-3 text-primary" />
                        <h4 className="font-medium mb-1">Browse Mode</h4>
                        <p className="text-sm text-muted-foreground">
                          Flip through all cards at your own pace
                        </p>
                      </CardContent>
                    </Card>
                    <Card 
                      className={`cursor-pointer hover-elevate ${dueCards.length === 0 ? "opacity-50" : ""}`}
                      onClick={dueCards.length > 0 ? startSpacedMode : undefined}
                      data-testid="button-spaced-mode"
                    >
                      <CardContent className="pt-6 text-center">
                        <Zap className="w-8 h-8 mx-auto mb-3 text-primary" />
                        <h4 className="font-medium mb-1">Spaced Repetition</h4>
                        <p className="text-sm text-muted-foreground">
                          {dueCards.length > 0 
                            ? `${dueCards.length} cards due for review`
                            : "No cards due - check back later"
                          }
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : isSessionComplete ? (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Session Complete!</CardTitle>
                <CardDescription>Great job on your study session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3 text-center">
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-3xl font-bold">{studySession.reviewed}</div>
                    <div className="text-sm text-muted-foreground">Cards Reviewed</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-3xl font-bold text-green-500">{studySession.correct}</div>
                    <div className="text-sm text-muted-foreground">Correct</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-3xl font-bold">
                      {Math.round(Date.now() - studySession.startTime.getTime()) / 1000 / 60 | 0}m
                    </div>
                    <div className="text-sm text-muted-foreground">Time Spent</div>
                  </div>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <Button variant="outline" onClick={resetStudy}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Decks
                  </Button>
                  <Button onClick={() => {
                    setStudySession(null);
                    setCurrentIndex(0);
                    refetchDue();
                  }}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Study Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : currentCard && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <Badge variant="outline" className="no-default-active-elevate">
                  Card {currentIndex + 1} of {studySession.cards.length}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="no-default-active-elevate"
                >
                  {studyMode === "spaced" ? "Spaced Repetition" : "Browse Mode"}
                </Badge>
              </div>

              <Progress 
                value={((currentIndex + 1) / studySession.cards.length) * 100} 
                className="h-2"
              />

              <div 
                className="perspective-1000 cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
                data-testid="flashcard"
              >
                <div className={`relative transition-transform duration-500 preserve-3d ${isFlipped ? "rotate-y-180" : ""}`}>
                  <Card className="min-h-[300px] flex items-center justify-center">
                    <CardContent className="text-center p-8">
                      {!isFlipped ? (
                        <div>
                          <p className="text-sm text-muted-foreground mb-4">FRONT</p>
                          <h2 className="text-2xl font-medium" data-testid="text-card-front">
                            {currentCard.front}
                          </h2>
                          <p className="text-sm text-muted-foreground mt-6">
                            Click to reveal answer
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-muted-foreground mb-4">BACK</p>
                          <h2 className="text-2xl font-medium" data-testid="text-card-back">
                            {currentCard.back}
                          </h2>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                {studyMode === "browse" ? (
                  <div className="flex justify-between w-full">
                    <Button 
                      variant="outline" 
                      onClick={() => navigateCard("prev")}
                      disabled={currentIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    <Button 
                      onClick={() => navigateCard("next")}
                      disabled={currentIndex === studySession.cards.length - 1}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ) : isFlipped ? (
                  <div className="flex justify-center gap-4 w-full">
                    <Button 
                      variant="outline"
                      className="flex-1 max-w-[200px] border-red-500 text-red-500"
                      onClick={() => handleResponse(1)}
                      disabled={reviewMutation.isPending}
                      data-testid="button-again"
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Again
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1 max-w-[200px] border-yellow-500 text-yellow-500"
                      onClick={() => handleResponse(3)}
                      disabled={reviewMutation.isPending}
                      data-testid="button-good"
                    >
                      Good
                    </Button>
                    <Button 
                      className="flex-1 max-w-[200px]"
                      onClick={() => handleResponse(5)}
                      disabled={reviewMutation.isPending}
                      data-testid="button-easy"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Easy
                    </Button>
                  </div>
                ) : (
                  <div className="text-center w-full text-muted-foreground">
                    <p>Click the card to reveal the answer</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
