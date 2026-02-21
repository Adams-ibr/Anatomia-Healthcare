import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { BookOpen, ArrowLeft, Play } from "lucide-react";
import type { Course, Enrollment } from "@shared/schema";

type EnrollmentWithCourse = Enrollment & { course: Course };

function CourseSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-40 w-full rounded-lg mb-4" />
                <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-2 w-full" />
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    );
}

export default function MyCourses() {
    const { data: enrollments, isLoading } = useQuery<EnrollmentWithCourse[]>({
        queryKey: ["/api/lms/enrollments/me"],
    });

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <Link href="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4 transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold">My Enrolled Courses</h1>
                    <p className="text-muted-foreground mt-2">Access all your active and completed courses</p>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => <CourseSkeleton key={i} />)}
                    </div>
                ) : !enrollments || enrollments.length === 0 ? (
                    <div className="text-center py-16 bg-muted/30 rounded-2xl border-2 border-dashed">
                        <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No courses enrolled yet</h3>
                        <p className="text-muted-foreground mb-8">Start your learning journey by exploring our catalog</p>
                        <Button asChild>
                            <Link href="/courses">Browse Catalog</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrollments.map((enrollment) => (
                            <Card key={enrollment.id} className="overflow-hidden hover-elevate">
                                <div className="aspect-video relative bg-muted">
                                    {enrollment.course?.thumbnailUrl ? (
                                        <img
                                            src={enrollment.course.thumbnailUrl}
                                            alt={enrollment.course.title}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <BookOpen className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                    )}
                                    <Badge
                                        variant={enrollment.status === "completed" ? "default" : "secondary"}
                                        className="absolute top-3 right-3"
                                    >
                                        {enrollment.status === "completed" ? "Completed" : "Active"}
                                    </Badge>
                                </div>
                                <CardHeader>
                                    <CardTitle className="line-clamp-1">{enrollment.course?.title}</CardTitle>
                                    <CardDescription>
                                        Last accessed: {enrollment.lastAccessedAt ? new Date(enrollment.lastAccessedAt).toLocaleDateString() : "Not yet started"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="font-medium">{enrollment.progress || 0}%</span>
                                        </div>
                                        <Progress value={enrollment.progress || 0} className="h-2" />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full gap-2" asChild>
                                        <Link href={`/learn/${enrollment.courseId}`}>
                                            <Play className="h-4 w-4" />
                                            {enrollment.status === "completed" ? "Review Content" : "Continue Learning"}
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
