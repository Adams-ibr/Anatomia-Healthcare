import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Clock, Users, ArrowLeft, CheckCircle2, Crown } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { Course, CourseModule, CourseLesson } from "@shared/schema";

type CourseWithModules = Course & {
    modules: (CourseModule & {
        lessons: CourseLesson[];
    })[];
    isEnrolled?: boolean;
};

export default function CourseLanding() {
    const [match, params] = useRoute("/courses/:slug");
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const slug = params?.slug;

    const { data: course, isLoading, error } = useQuery<CourseWithModules>({
        queryKey: ["/api/lms/courses/by-slug", slug],
        queryFn: async () => {
            const res = await fetch(`/api/lms/courses/by-slug/${slug}`);
            if (!res.ok) {
                if (res.status === 404) throw new Error("Course not found");
                throw new Error("Failed to fetch course details");
            }
            return res.json();
        },
        enabled: !!slug,
    });

    const enrollMutation = useMutation({
        mutationFn: async () => {
            if (!course) return;
            const res = await apiRequest("POST", "/api/lms/enrollments", { courseId: course.id });
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "Successfully enrolled!",
                description: `You are now enrolled in ${course?.title}`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/lms/courses/by-slug", slug] });
            if (course) {
                setLocation(`/learn/${course.id}`);
            }
        },
        onError: (err: any) => {
            toast({
                title: "Enrollment failed",
                description: err.message || "Failed to enroll in this course. Please check your membership tier.",
                variant: "destructive",
            });
        }
    });

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Skeleton className="h-8 w-32 mb-8" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-12 w-3/4" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-5/6" />
                        <Skeleton className="h-[400px] w-full mt-8" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-[300px] w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-4xl font-bold mb-4 text-destructive">Course Not Found</h1>
                <p className="text-muted-foreground mb-8">The course you are looking for does not exist or has been removed.</p>
                <Button asChild>
                    <Link href="/courses">Back to Course Catalog</Link>
                </Button>
            </div>
        );
    }

    const getLevelColor = (level: string | null) => {
        switch (level?.toLowerCase()) {
            case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
            case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
            case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
            default: return "";
        }
    };

    const isFree = course.isFree || course.requiredMembershipTier === "bronze" || !course.requiredMembershipTier;

    return (
        <div className="min-h-screen bg-background pb-16">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white py-12 md:py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl">
                        <Link href="/courses" className="inline-flex items-center text-slate-300 hover:text-white mb-6 transition-colors font-medium">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Catalog
                        </Link>

                        <div className="flex flex-wrap gap-3 mb-6">
                            <Badge variant="secondary" className={`bg-white/20 text-white hover:bg-white/30 border-none`}>
                                {course.category}
                            </Badge>
                            <Badge variant="outline" className={`${getLevelColor(course.level)} border-none`}>
                                {course.level}
                            </Badge>
                            {!isFree && (
                                <Badge className="bg-amber-500 text-white border-none flex items-center gap-1">
                                    <Crown className="w-3 h-3" /> Premium
                                </Badge>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                            {course.title}
                        </h1>

                        <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-3xl leading-relaxed">
                            {course.shortDescription || course.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-300">
                            {course.duration && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-slate-400" />
                                    <span>{course.duration}</span>
                                </div>
                            )}
                            {course.modules && (
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-slate-400" />
                                    <span>{course.modules.length} Modules</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content Info */}
                    <div className="lg:col-span-2 space-y-12">

                        <section>
                            <h2 className="text-3xl font-bold mb-6">About this course</h2>
                            <div
                                className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: course.description || "No detailed description provided." }}
                            />
                        </section>

                        <Separator />

                        {/* Curriculum Section */}
                        <section>
                            <h2 className="text-3xl font-bold mb-6">Course Curriculum</h2>
                            {!course.modules || course.modules.length === 0 ? (
                                <p className="text-muted-foreground italic">Curriculum is being updated.</p>
                            ) : (
                                <div className="space-y-6">
                                    {course.modules.map((module, idx) => (
                                        <div key={module.id} className="border rounded-xl p-6 bg-card shadow-sm">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="text-xl font-semibold mb-1">
                                                        Module {idx + 1}: {module.title}
                                                    </h3>
                                                    {module.description && (
                                                        <p className="text-muted-foreground text-sm">{module.description}</p>
                                                    )}
                                                </div>
                                                <Badge variant="secondary">{module.lessons?.length || 0} lessons</Badge>
                                            </div>

                                            {module.lessons && module.lessons.length > 0 && (
                                                <div className="mt-4 space-y-3 pl-4 border-l-2 border-muted">
                                                    {module.lessons.map((lesson, lessonIdx) => (
                                                        <div key={lesson.id} className="flex items-center gap-3 text-sm">
                                                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-xs flex-shrink-0">
                                                                {lessonIdx + 1}
                                                            </div>
                                                            <span className="font-medium text-foreground">{lesson.title}</span>
                                                            {lesson.duration && (
                                                                <span className="text-muted-foreground text-xs ml-auto">{lesson.duration}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Sticky Sidebar */}
                    <div className="relative">
                        <div className="sticky top-24 border rounded-2xl p-6 shadow-xl bg-card">
                            {course.thumbnailUrl ? (
                                <div className="aspect-video rounded-xl overflow-hidden mb-6 bg-muted">
                                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="aspect-video rounded-xl bg-primary/5 flex items-center justify-center mb-6">
                                    <BookOpen className="w-16 h-16 text-primary/20" />
                                </div>
                            )}

                            <div className="mb-6">
                                <div className="text-3xl font-bold mb-2">
                                    {isFree ? "Free" : (course.price && course.price > 0 ? `$${course.price.toFixed(2)}` : "Premium")}
                                </div>
                            </div>

                            {course.isEnrolled ? (
                                <Button className="w-full text-lg h-14" size="lg" onClick={() => setLocation(`/learn/${course.id}`)}>
                                    Go to Course
                                </Button>
                            ) : (
                                <Button
                                    className="w-full text-lg h-14"
                                    size="lg"
                                    onClick={() => enrollMutation.mutate()}
                                    disabled={enrollMutation.isPending}
                                >
                                    {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                                </Button>
                            )}

                            <Separator className="my-6" />

                            <div className="space-y-4">
                                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">What's included</h4>
                                <div className="flex items-center gap-3 text-sm">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <span>Full lifetime access</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <span>Access on mobile and desktop</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <span>Certificate of completion</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
