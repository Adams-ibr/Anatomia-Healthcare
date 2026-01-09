import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  BookOpen, Play, CheckCircle, Clock, ChevronLeft, ChevronRight, 
  FileText, Video, Brain, Layers3, Award, Maximize, Minimize,
  RotateCcw, MessageCircle
} from "lucide-react";
import type { Course, CourseModule, Lesson, LessonProgress, Enrollment, LessonAsset, Quiz } from "@shared/schema";
import { ModelViewer } from "@/components/ModelViewer";
import { DiscussionBoard } from "@/components/DiscussionBoard";
import { useMember } from "@/components/StudentLayout";

type LessonWithProgress = Lesson & { 
  progress?: LessonProgress | null;
};

type ModuleWithLessons = CourseModule & { 
  lessons: LessonWithProgress[];
};

type CourseWithContent = Course & { 
  enrollment: Enrollment;
  modules: ModuleWithLessons[];
};

type LessonWithDetails = Lesson & {
  progress?: LessonProgress | null;
  assets: LessonAsset[];
  quizzes: Quiz[];
  moduleTitle: string;
  courseId: string;
};

function PlayerSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-80 border-r p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <div className="space-y-2 mt-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-8">
        <Skeleton className="h-96 w-full mb-4" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

export default function CoursePlayer() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(lessonId || null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showDiscussions, setShowDiscussions] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { member } = useMember();

  const { data: course, isLoading: courseLoading } = useQuery<CourseWithContent>({
    queryKey: ["/api/lms/courses", courseId, "content"],
    enabled: !!courseId,
  });

  const { data: currentLesson, isLoading: lessonLoading } = useQuery<LessonWithDetails>({
    queryKey: ["/api/lms/lessons", currentLessonId],
    enabled: !!currentLessonId,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data: { lessonId: string; isCompleted?: boolean; progressPercent?: number; timeSpentSeconds?: number; resumePositionSeconds?: number }) => {
      return apiRequest("POST", `/api/lms/lessons/${data.lessonId}/progress`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/courses", courseId, "content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lms/lessons", currentLessonId] });
    },
  });

  useEffect(() => {
    if (course && !currentLessonId) {
      const firstLesson = course.modules
        .flatMap(m => m.lessons)
        .sort((a, b) => (a.order || 0) - (b.order || 0))[0];
      if (firstLesson) {
        setCurrentLessonId(firstLesson.id);
      }
    }
  }, [course, currentLessonId]);

  useEffect(() => {
    if (currentLessonId) {
      timerRef.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentLessonId]);

  useEffect(() => {
    // Only update progress if lesson is not already completed
    const isCompleted = currentLesson?.progress?.isCompleted;
    if (timeSpent > 0 && timeSpent % 30 === 0 && currentLessonId && !isCompleted) {
      updateProgressMutation.mutate({
        lessonId: currentLessonId,
        timeSpentSeconds: 30,
      });
    }
  }, [timeSpent, currentLessonId, currentLesson?.progress?.isCompleted]);

  const allLessons = course?.modules.flatMap(m => m.lessons).sort((a, b) => (a.order || 0) - (b.order || 0)) || [];
  const currentLessonIndex = allLessons.findIndex(l => l.id === currentLessonId);
  const previousLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const completedLessons = allLessons.filter(l => l.progress?.isCompleted).length;
  const totalLessons = allLessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const handleMarkComplete = () => {
    if (currentLessonId) {
      // Clear timer and reset time before marking complete
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimeSpent(0);
      
      updateProgressMutation.mutate({
        lessonId: currentLessonId,
        isCompleted: true,
        progressPercent: 100,
      });
    }
  };

  const handleSelectLesson = (lessonId: string) => {
    if (currentLessonId && timeSpent > 0) {
      updateProgressMutation.mutate({
        lessonId: currentLessonId,
        timeSpentSeconds: timeSpent,
      });
    }
    setTimeSpent(0);
    setCurrentLessonId(lessonId);
  };

  const handleNavigate = (lesson: LessonWithProgress) => {
    handleSelectLesson(lesson.id);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      contentRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (courseLoading) {
    return <PlayerSkeleton />;
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
        <p className="text-muted-foreground mb-6">This course may not exist or you may not be enrolled.</p>
        <Button asChild data-testid="button-browse-courses">
          <Link href="/courses">Browse Courses</Link>
        </Button>
      </div>
    );
  }

  const getLessonIcon = (contentType: string) => {
    switch (contentType) {
      case "video":
        return Video;
      case "quiz":
        return Brain;
      case "3d_model":
        return Layers3;
      default:
        return FileText;
    }
  };

  return (
    <div className="flex h-[calc(100vh-1rem)]">
      <div className="w-80 border-r flex flex-col bg-background">
        <div className="p-4 border-b">
          <Button variant="ghost" size="sm" asChild className="mb-2" data-testid="button-back-dashboard">
            <Link href="/dashboard">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </Button>
          <h2 className="font-semibold truncate" data-testid="text-course-title">{course.title}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Progress value={progressPercent} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground">{progressPercent}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {completedLessons} of {totalLessons} lessons complete
          </p>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            <Accordion type="multiple" defaultValue={course.modules.map(m => m.id)} className="space-y-1">
              {course.modules.map((module) => (
                <AccordionItem key={module.id} value={module.id} className="border-none">
                  <AccordionTrigger className="px-3 py-2 text-sm font-medium hover:no-underline hover-elevate rounded-md" data-testid={`accordion-module-${module.id}`}>
                    <span className="truncate text-left">{module.title}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <div className="space-y-1 ml-2">
                      {module.lessons.map((lesson) => {
                        const Icon = getLessonIcon(lesson.contentType);
                        const isActive = lesson.id === currentLessonId;
                        const isComplete = lesson.progress?.isCompleted;
                        
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleSelectLesson(lesson.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors ${
                              isActive 
                                ? "bg-primary/10 text-primary" 
                                : "hover-elevate"
                            }`}
                            data-testid={`button-lesson-${lesson.id}`}
                          >
                            {isComplete ? (
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="truncate flex-1">{lesson.title}</span>
                            {lesson.duration && (
                              <span className="text-xs text-muted-foreground">{lesson.duration}m</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t">
          <Button
            variant={showDiscussions ? "default" : "outline"}
            className="w-full gap-2"
            onClick={() => setShowDiscussions(!showDiscussions)}
            data-testid="button-toggle-discussions"
          >
            <MessageCircle className="h-4 w-4" />
            {showDiscussions ? "Show Lessons" : "Discussions"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden" ref={contentRef}>
        {showDiscussions ? (
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto">
              <DiscussionBoard courseId={courseId!} currentMemberId={member?.id} />
            </div>
          </div>
        ) : lessonLoading ? (
          <div className="flex-1 p-8">
            <Skeleton className="h-96 w-full mb-4" />
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : currentLesson ? (
          <>
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{currentLesson.moduleTitle}</p>
                    <h1 className="text-2xl font-bold" data-testid="text-lesson-title">{currentLesson.title}</h1>
                    {currentLesson.description && (
                      <p className="text-muted-foreground mt-1">{currentLesson.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {currentLesson.duration && (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {currentLesson.duration} min
                      </Badge>
                    )}
                    <Button variant="ghost" size="icon" onClick={toggleFullscreen} data-testid="button-fullscreen">
                      {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Separator className="my-4" />

                {currentLesson.contentType === "video" && currentLesson.videoUrl && (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
                    <video
                      src={currentLesson.videoUrl}
                      controls
                      className="w-full h-full"
                      data-testid="video-player"
                    />
                  </div>
                )}

                {currentLesson.contentType === "3d_model" && currentLesson.assets && currentLesson.assets.length > 0 && (
                  <div className="mb-6">
                    {currentLesson.assets
                      .filter(a => a.assetType === "3d_model")
                      .map(asset => (
                        <Card key={asset.id} className="mb-4">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Layers3 className="h-5 w-5" />
                              {asset.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-96">
                              <ModelViewer
                                src={asset.assetUrl}
                                alt={asset.title}
                                autoRotate
                                showControls
                                className="w-full h-full"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}

                {currentLesson.content && (
                  <div 
                    className="prose prose-slate dark:prose-invert max-w-none mb-6"
                    dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                    data-testid="lesson-content"
                  />
                )}

                {currentLesson.quizzes && currentLesson.quizzes.length > 0 && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Quiz
                      </CardTitle>
                      <CardDescription>Test your knowledge from this lesson</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {currentLesson.quizzes.map(quiz => (
                        <div key={quiz.id} className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{quiz.title}</h4>
                            {quiz.description && (
                              <p className="text-sm text-muted-foreground">{quiz.description}</p>
                            )}
                          </div>
                          <Button asChild data-testid={`button-start-quiz-${quiz.id}`}>
                            <Link href={`/quiz/${quiz.id}`}>Start Quiz</Link>
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {currentLesson.assets && currentLesson.assets.filter(a => a.assetType !== "3d_model").length > 0 && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Additional Resources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {currentLesson.assets
                          .filter(a => a.assetType !== "3d_model")
                          .map(asset => (
                            <a
                              key={asset.id}
                              href={asset.assetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 rounded-md hover-elevate"
                              data-testid={`link-asset-${asset.id}`}
                            >
                              <FileText className="h-4 w-4" />
                              <span>{asset.title}</span>
                            </a>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="border-t p-4 bg-background">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={() => previousLesson && handleNavigate(previousLesson)}
                  disabled={!previousLesson}
                  data-testid="button-previous-lesson"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-4">
                  {currentLesson.progress?.isCompleted ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Completed
                    </Badge>
                  ) : (
                    <Button onClick={handleMarkComplete} data-testid="button-mark-complete">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Complete
                    </Button>
                  )}
                </div>
                
                <Button
                  variant={nextLesson ? "default" : "outline"}
                  onClick={() => nextLesson && handleNavigate(nextLesson)}
                  disabled={!nextLesson}
                  data-testid="button-next-lesson"
                >
                  {nextLesson ? "Next" : "Course Complete"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Select a Lesson</h2>
              <p className="text-muted-foreground">Choose a lesson from the sidebar to start learning</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
