import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Target,
  Trophy,
  ChevronRight,
  Brain
} from "lucide-react";
import type { QuestionTopic, QuestionBankItem } from "@shared/schema";

interface QuestionWithOptions extends QuestionBankItem {
  options?: Array<{
    id: string;
    optionText: string;
    isCorrect: boolean;
    explanation: string | null;
    order: number;
  }>;
}

interface PracticeSession {
  questions: QuestionWithOptions[];
  currentIndex: number;
  answers: Map<string, string | string[]>;
  results: Map<string, boolean>;
  startTime: Date;
  isComplete: boolean;
}

export default function PracticeMode() {
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const { data: topics = [] } = useQuery<QuestionTopic[]>({
    queryKey: ["/api/lms/question-topics"],
  });

  const { data: allQuestions = [], isLoading } = useQuery<QuestionBankItem[]>({
    queryKey: ["/api/lms/question-bank"],
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session && !session.isComplete) {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - session.startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session]);

  const startPractice = async () => {
    let filtered = [...allQuestions];
    
    if (selectedTopic) {
      filtered = filtered.filter(q => q.topicId === selectedTopic);
    }
    if (selectedDifficulty) {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }

    const shuffled = filtered.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    const questionsWithOptions = await Promise.all(
      selected.map(async (q) => {
        const res = await fetch(`/api/lms/question-bank/${q.id}`);
        return res.json();
      })
    );

    setSession({
      questions: questionsWithOptions,
      currentIndex: 0,
      answers: new Map(),
      results: new Map(),
      startTime: new Date(),
      isComplete: false,
    });
    setSelectedAnswer([]);
    setShowResult(false);
    setTimeElapsed(0);
  };

  const submitAnswer = () => {
    if (!session) return;
    
    const currentQuestion = session.questions[session.currentIndex];
    const options = currentQuestion.options || [];
    
    let isCorrect = false;
    if (currentQuestion.questionType === "multiple_choice" || currentQuestion.questionType === "true_false") {
      const correctOptions = options.filter(o => o.isCorrect).map(o => o.id);
      isCorrect = 
        selectedAnswer.length === correctOptions.length &&
        selectedAnswer.every(a => correctOptions.includes(a));
    }

    const newAnswers = new Map(session.answers);
    newAnswers.set(currentQuestion.id, selectedAnswer);
    
    const newResults = new Map(session.results);
    newResults.set(currentQuestion.id, isCorrect);

    setSession({
      ...session,
      answers: newAnswers,
      results: newResults,
    });
    setShowResult(true);
  };

  const nextQuestion = () => {
    if (!session) return;
    
    const nextIndex = session.currentIndex + 1;
    if (nextIndex >= session.questions.length) {
      setSession({ ...session, isComplete: true });
    } else {
      setSession({ ...session, currentIndex: nextIndex });
      setSelectedAnswer([]);
      setShowResult(false);
    }
  };

  const resetPractice = () => {
    setSession(null);
    setSelectedAnswer([]);
    setShowResult(false);
    setTimeElapsed(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getScore = () => {
    if (!session) return { correct: 0, total: 0, percentage: 0 };
    const correct = Array.from(session.results.values()).filter(Boolean).length;
    const total = session.questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, total, percentage };
  };

  const toggleAnswer = (optionId: string, questionType: string) => {
    if (questionType === "true_false" || questionType === "multiple_choice") {
      if (questionType === "true_false") {
        setSelectedAnswer([optionId]);
      } else {
        if (selectedAnswer.includes(optionId)) {
          setSelectedAnswer(selectedAnswer.filter(a => a !== optionId));
        } else {
          setSelectedAnswer([...selectedAnswer, optionId]);
        }
      }
    }
  };

  const currentQuestion = session?.questions[session.currentIndex];
  const score = getScore();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Practice Mode</h1>
            <p className="text-muted-foreground">
              Test your knowledge with randomized questions from our question bank.
            </p>
          </div>

          {!session ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Configure Your Practice Session
                </CardTitle>
                <CardDescription>
                  Select your preferences to customize your practice experience.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Topic</label>
                    <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                      <SelectTrigger data-testid="select-topic">
                        <SelectValue placeholder="All Topics" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Topics</SelectItem>
                        {topics.map((topic) => (
                          <SelectItem key={topic.id} value={topic.id}>
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty</label>
                    <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                      <SelectTrigger data-testid="select-difficulty">
                        <SelectValue placeholder="All Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Levels</SelectItem>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of Questions</label>
                    <Select 
                      value={questionCount.toString()} 
                      onValueChange={(v) => setQuestionCount(parseInt(v))}
                    >
                      <SelectTrigger data-testid="select-count">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Questions</SelectItem>
                        <SelectItem value="10">10 Questions</SelectItem>
                        <SelectItem value="15">15 Questions</SelectItem>
                        <SelectItem value="20">20 Questions</SelectItem>
                        <SelectItem value="25">25 Questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {allQuestions.length} questions available
                    {selectedTopic && ` in ${topics.find(t => t.id === selectedTopic)?.name}`}
                    {selectedDifficulty && ` (${selectedDifficulty})`}
                  </div>
                  <Button 
                    onClick={startPractice} 
                    disabled={isLoading || allQuestions.length === 0}
                    data-testid="button-start-practice"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Practice
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : session.isComplete ? (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Practice Complete!</CardTitle>
                <CardDescription>Here's how you did:</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3 text-center">
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-3xl font-bold text-primary">{score.percentage}%</div>
                    <div className="text-sm text-muted-foreground">Score</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-3xl font-bold">{score.correct}/{score.total}</div>
                    <div className="text-sm text-muted-foreground">Correct Answers</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-3xl font-bold">{formatTime(timeElapsed)}</div>
                    <div className="text-sm text-muted-foreground">Time Taken</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Question Results</h3>
                  <div className="grid gap-2">
                    {session.questions.map((q, i) => (
                      <div 
                        key={q.id} 
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted"
                        data-testid={`result-question-${i}`}
                      >
                        {session.results.get(q.id) ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        )}
                        <span className="text-sm line-clamp-1 flex-1">{q.question}</span>
                        <Badge 
                          variant="outline" 
                          className="no-default-active-elevate"
                        >
                          {q.difficulty}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <Button variant="outline" onClick={resetPractice} data-testid="button-new-session">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Session
                  </Button>
                  <Button onClick={startPractice} data-testid="button-retry">
                    <Play className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : currentQuestion && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="no-default-active-elevate">
                    Question {session.currentIndex + 1} of {session.questions.length}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={`no-default-active-elevate ${
                      currentQuestion.difficulty === "easy" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : currentQuestion.difficulty === "hard"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    }`}
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{formatTime(timeElapsed)}</span>
                </div>
              </div>

              <Progress 
                value={(session.currentIndex / session.questions.length) * 100} 
                className="h-2"
              />

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-medium mb-4" data-testid="text-question">
                        {currentQuestion.question}
                      </h2>
                      {currentQuestion.options && currentQuestion.options.length > 0 && (
                        <div className="space-y-3">
                          {currentQuestion.options.map((option) => {
                            const isSelected = selectedAnswer.includes(option.id);
                            const isCorrect = option.isCorrect;
                            
                            let optionClass = "p-4 rounded-lg border cursor-pointer transition-colors ";
                            if (showResult) {
                              if (isCorrect) {
                                optionClass += "bg-green-50 border-green-500 dark:bg-green-900/20";
                              } else if (isSelected && !isCorrect) {
                                optionClass += "bg-red-50 border-red-500 dark:bg-red-900/20";
                              } else {
                                optionClass += "bg-muted opacity-50";
                              }
                            } else {
                              optionClass += isSelected 
                                ? "bg-primary/10 border-primary" 
                                : "hover-elevate";
                            }

                            return (
                              <div
                                key={option.id}
                                className={optionClass}
                                onClick={() => !showResult && toggleAnswer(option.id, currentQuestion.questionType)}
                                data-testid={`option-${option.id}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                                    isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                                  }`}>
                                    {isSelected && (
                                      <CheckCircle2 className="w-full h-full text-primary-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <span>{option.optionText}</span>
                                    {showResult && option.explanation && (
                                      <p className="text-sm text-muted-foreground mt-2">
                                        {option.explanation}
                                      </p>
                                    )}
                                  </div>
                                  {showResult && isCorrect && (
                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  )}
                                  {showResult && isSelected && !isCorrect && (
                                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {showResult && currentQuestion.explanation && (
                      <div className="p-4 rounded-lg bg-muted">
                        <h4 className="font-medium mb-1">Explanation</h4>
                        <p className="text-sm text-muted-foreground">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between pt-4 border-t">
                      <Button variant="outline" onClick={resetPractice}>
                        End Session
                      </Button>
                      {!showResult ? (
                        <Button 
                          onClick={submitAnswer} 
                          disabled={selectedAnswer.length === 0}
                          data-testid="button-submit-answer"
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Submit Answer
                        </Button>
                      ) : (
                        <Button onClick={nextQuestion} data-testid="button-next-question">
                          {session.currentIndex === session.questions.length - 1 
                            ? "View Results" 
                            : "Next Question"
                          }
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
