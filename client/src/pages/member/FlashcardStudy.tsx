import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  RotateCcw, 
  ChevronLeft,
  ChevronRight,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Layers,
  CheckCircle2,
  Loader2,
  BookOpen,
  HelpCircle,
  Check,
  X
} from "lucide-react";
import type { FlashcardDeck, Flashcard } from "@shared/schema";

interface FlashcardOption {
  text: string;
  isCorrect: boolean;
}

interface FlashcardWithProgress extends Omit<Flashcard, 'options'> {
  options?: FlashcardOption[] | unknown;
  progress?: {
    masteryLevel: number;
    interval: number;
    nextReviewAt: Date | null;
    reviewCount: number;
  };
}

interface DeckWithCards extends FlashcardDeck {
  flashcards: FlashcardWithProgress[];
}

export default function FlashcardStudy() {
  const [selectedDeck, setSelectedDeck] = useState<DeckWithCards | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState<"browse" | "spaced">("browse");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswerResult, setShowAnswerResult] = useState(false);
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
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: dueCards = [], isLoading: dueLoading, refetch: refetchDue } = useQuery<FlashcardWithProgress[]>({
    queryKey: ["/api/lms/flashcard-decks", selectedDeck?.id, "due"],
    queryFn: async () => {
      if (!selectedDeck) return [];
      const res = await fetch(`/api/lms/flashcard-decks/${selectedDeck.id}/due`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedDeck && studyMode === "spaced",
  });

  const reviewMutation = useMutation({
    mutationFn: ({ flashcardId, quality }: { flashcardId: string; quality: number }) =>
      apiRequest("POST", `/api/lms/flashcards/${flashcardId}/review`, { quality }),
    onSuccess: () => {
      if (studySession) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setIsFlipped(false);
        setSelectedAnswer(null);
        setShowAnswerResult(false);
        if (nextIndex >= studySession.cards.length) {
          refetchDue();
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
      setSelectedAnswer(null);
      setShowAnswerResult(false);
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
    setSelectedAnswer(null);
    setShowAnswerResult(false);
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
      setSelectedAnswer(null);
      setShowAnswerResult(false);
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
      setSelectedAnswer(null);
      setShowAnswerResult(false);
    } else if (direction === "next" && currentIndex < studySession.cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setSelectedAnswer(null);
      setShowAnswerResult(false);
    }
  };

  const resetStudy = () => {
    setSelectedDeck(null);
    setStudySession(null);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSelectedAnswer(null);
    setShowAnswerResult(false);
  };

  const getCardOptions = (card: FlashcardWithProgress): FlashcardOption[] => {
    if (!card.options) return [];
    if (Array.isArray(card.options)) {
      return card.options as FlashcardOption[];
    }
    return [];
  };

  const handleCheckAnswer = () => {
    if (!currentCard || !selectedAnswer) return;
    setShowAnswerResult(true);
    setIsFlipped(true);
  };

  const isAnswerCorrect = (card: FlashcardWithProgress, answer: string | null): boolean => {
    if (!answer) return false;
    const options = getCardOptions(card);
    const selectedOption = options.find(opt => opt.text === answer);
    return selectedOption?.isCorrect || false;
  };

  const currentCard = studySession?.cards[currentIndex];
  const isSessionComplete = studySession && currentIndex >= studySession.cards.length;
  const cardOptions = currentCard ? getCardOptions(currentCard) : [];
  const isQuestionCard = currentCard?.cardType === "question" && cardOptions.length > 0;

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
                    <div className="text-3xl font-bold">{selectedDeck.flashcards?.length || 0}</div>
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
                      {Math.round((Date.now() - studySession.startTime.getTime()) / 1000 / 60)}m
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
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="no-default-active-elevate">
                    Card {currentIndex + 1} of {studySession.cards.length}
                  </Badge>
                  <Badge variant={isQuestionCard ? "default" : "secondary"} className="no-default-active-elevate">
                    {isQuestionCard ? (
                      <><HelpCircle className="h-3 w-3 mr-1" /> Question</>
                    ) : (
                      <><BookOpen className="h-3 w-3 mr-1" /> Learning</>
                    )}
                  </Badge>
                </div>
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

              {isQuestionCard ? (
                <Card className="min-h-[300px]">
                  <CardContent className="p-8 space-y-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">QUESTION</p>
                      <h2 className="text-xl font-medium" data-testid="text-card-front">
                        {currentCard.front}
                      </h2>
                    </div>

                    <RadioGroup 
                      value={selectedAnswer || ""} 
                      onValueChange={setSelectedAnswer}
                      disabled={showAnswerResult}
                      className="space-y-3"
                    >
                      {cardOptions.map((option, index) => {
                        const isSelected = selectedAnswer === option.text;
                        const showCorrect = showAnswerResult && option.isCorrect;
                        const showIncorrect = showAnswerResult && isSelected && !option.isCorrect;
                        
                        return (
                          <div 
                            key={index}
                            className={`flex items-center space-x-3 p-3 rounded-md border transition-colors ${
                              showCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/20" :
                              showIncorrect ? "border-red-500 bg-red-50 dark:bg-red-900/20" :
                              isSelected ? "border-primary" : "border-border"
                            }`}
                          >
                            <RadioGroupItem 
                              value={option.text} 
                              id={`option-${index}`}
                              data-testid={`radio-option-${index}`}
                            />
                            <Label 
                              htmlFor={`option-${index}`} 
                              className="flex-1 cursor-pointer flex items-center justify-between"
                            >
                              {option.text}
                              {showCorrect && <Check className="h-5 w-5 text-green-500" />}
                              {showIncorrect && <X className="h-5 w-5 text-red-500" />}
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>

                    {showAnswerResult && currentCard.explanation && (
                      <div className="p-4 rounded-md bg-muted">
                        <p className="text-sm font-medium mb-1">Explanation:</p>
                        <p className="text-sm text-muted-foreground">{currentCard.explanation}</p>
                      </div>
                    )}

                    {showAnswerResult && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Answer:</p>
                        <p className="font-medium">{currentCard.back}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div 
                  className="perspective-1000 cursor-pointer"
                  onClick={() => setIsFlipped(!isFlipped)}
                  data-testid="flashcard"
                >
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
                          {currentCard.explanation && (
                            <p className="text-sm text-muted-foreground mt-4">
                              {currentCard.explanation}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                {studyMode === "browse" ? (
                  <div className="flex justify-between w-full gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => navigateCard("prev")}
                      disabled={currentIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    
                    {isQuestionCard && !showAnswerResult ? (
                      <Button 
                        onClick={handleCheckAnswer}
                        disabled={!selectedAnswer}
                      >
                        Check Answer
                      </Button>
                    ) : null}
                    
                    <Button 
                      onClick={() => navigateCard("next")}
                      disabled={currentIndex === studySession.cards.length - 1}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ) : (isFlipped || (isQuestionCard && showAnswerResult)) ? (
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
                ) : isQuestionCard ? (
                  <div className="flex justify-center w-full">
                    <Button 
                      onClick={handleCheckAnswer}
                      disabled={!selectedAnswer}
                    >
                      Check Answer
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
