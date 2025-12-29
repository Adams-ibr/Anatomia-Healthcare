import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { BookOpen, Award, Clock, Play, Bell, GraduationCap, TrendingUp, CheckCircle } from "lucide-react";
import type { Course, Enrollment, Notification, Certificate } from "@shared/schema";

type EnrollmentWithCourse = Enrollment & { course: Course };
type CertificateWithCourse = Certificate & { course: Course };

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-64 w-full" />
        </div>
        <div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery<EnrollmentWithCourse[]>({
    queryKey: ["/api/lms/enrollments/me"],
  });

  const { data: certificates } = useQuery<CertificateWithCourse[]>({
    queryKey: ["/api/lms/certificates/me"],
  });

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["/api/lms/notifications"],
  });

  const { data: memberData } = useQuery<{ firstName?: string; lastName?: string; email: string }>({
    queryKey: ["/api/members/me"],
  });

  if (enrollmentsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>
        <DashboardSkeleton />
      </div>
    );
  }

  const activeEnrollments = enrollments?.filter(e => e.status === "active") || [];
  const completedEnrollments = enrollments?.filter(e => e.status === "completed") || [];
  const inProgressCourses = activeEnrollments.filter(e => (e.progress ?? 0) > 0);
  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];

  const totalProgress = activeEnrollments.length > 0
    ? Math.round(activeEnrollments.reduce((sum, e) => sum + (e.progress ?? 0), 0) / activeEnrollments.length)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">
          Welcome back{memberData?.firstName ? `, ${memberData.firstName}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">Track your learning progress and continue your courses</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card data-testid="card-active-courses">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEnrollments.length}</div>
            <p className="text-xs text-muted-foreground">
              {inProgressCourses.length} in progress
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-completed-courses">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedEnrollments.length}</div>
            <p className="text-xs text-muted-foreground">
              {certificates?.length || 0} certificates earned
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-overall-progress">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProgress}%</div>
            <Progress value={totalProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card data-testid="card-notifications">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotifications.length}</div>
            <p className="text-xs text-muted-foreground">
              unread messages
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Continue Learning
              </CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </CardHeader>
            <CardContent>
              {inProgressCourses.length === 0 ? (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No courses in progress</h3>
                  <p className="text-muted-foreground mb-4">Start learning by enrolling in a course</p>
                  <Button asChild data-testid="button-browse-courses">
                    <Link href="/courses">Browse Courses</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {inProgressCourses.slice(0, 3).map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center gap-4 p-4 rounded-lg border hover-elevate"
                      data-testid={`card-course-${enrollment.courseId}`}
                    >
                      <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        {enrollment.course?.thumbnailUrl ? (
                          <img
                            src={enrollment.course.thumbnailUrl}
                            alt={enrollment.course?.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{enrollment.course?.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={enrollment.progress || 0} className="h-2 flex-1" />
                          <span className="text-sm text-muted-foreground">
                            {enrollment.progress || 0}%
                          </span>
                        </div>
                      </div>
                      <Button size="sm" asChild data-testid={`button-continue-${enrollment.courseId}`}>
                        <Link href={`/courses/${enrollment.course?.slug}`}>Continue</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                My Courses
              </CardTitle>
              <CardDescription>All your enrolled courses</CardDescription>
            </CardHeader>
            <CardContent>
              {enrollments?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No courses enrolled yet
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments?.slice(0, 5).map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between gap-4 py-3 border-b last:border-b-0"
                      data-testid={`row-enrollment-${enrollment.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{enrollment.course?.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={enrollment.status === "completed" ? "default" : "secondary"} className="text-xs">
                            {enrollment.status === "completed" ? "Completed" : `${enrollment.progress || 0}% Complete`}
                          </Badge>
                          {enrollment.course?.level && (
                            <Badge variant="outline" className="text-xs">
                              {enrollment.course.level}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/courses/${enrollment.course?.slug}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                  {(enrollments?.length || 0) > 5 && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/my-courses">View All Courses</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certificates
              </CardTitle>
              <CardDescription>Your achievements</CardDescription>
            </CardHeader>
            <CardContent>
              {!certificates || certificates.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Award className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Complete a course to earn your first certificate</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {certificates.slice(0, 3).map((cert) => (
                    <div
                      key={cert.id}
                      className="p-3 border rounded-lg"
                      data-testid={`card-certificate-${cert.id}`}
                    >
                      <h4 className="font-medium text-sm">{cert.course?.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Issued: {new Date(cert.issuedAt || "").toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {cert.certificateNumber}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!notifications || notifications.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${!notification.isRead ? "bg-accent/30" : ""}`}
                      data-testid={`notification-${notification.id}`}
                    >
                      <div className="flex items-start gap-2">
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        )}
                        <div>
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild data-testid="button-explore-courses">
                <Link href="/courses">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Explore Courses
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild data-testid="button-view-certificates">
                <Link href="/certificates">
                  <Award className="h-4 w-4 mr-2" />
                  View Certificates
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild data-testid="button-flashcards">
                <Link href="/flashcards">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Flashcards
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
