import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { BookOpen, Award, Clock, Play, Bell, GraduationCap, TrendingUp, CheckCircle } from "lucide-react";
import type { Course, Enrollment, Notification, Certificate, LessonProgress, Lesson } from "@shared/schema";
import { History, FileText } from "lucide-react";

type EnrollmentWithCourse = Enrollment & { course: Course };
type CertificateWithCourse = Certificate & { course: Course };
type RecentActivity = LessonProgress & { lesson?: Lesson; courseId?: string };

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

  const { data: recentActivity } = useQuery<RecentActivity[]>({
    queryKey: ["/api/lms/activity/recent"],
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
                        <Link href={`/learn/${enrollment.courseId}`}>Continue</Link>
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
                        <Link href={`/learn/${enrollment.courseId}`}>View</Link>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest learning sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {!recentActivity || recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                  <p className="text-xs mt-1">Start learning to see your activity here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity, index) => (
                    <div
                      key={activity.id || index}
                      className="flex items-center gap-3 py-2 border-b last:border-b-0"
                      data-testid={`activity-${activity.id}`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        {activity.isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.lesson?.title || `Lesson ${activity.lessonId?.slice(0, 8)}...`}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          {activity.isCompleted ? (
                            <Badge variant="default" className="text-xs">Completed</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              {activity.progressPercent || 0}% Progress
                            </Badge>
                          )}
                          {activity.timeSpentSeconds && activity.timeSpentSeconds > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.round(activity.timeSpentSeconds / 60)}m
                            </span>
                          )}
                          {activity.lastAccessedAt && (
                            <span>
                              {new Date(activity.lastAccessedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        asChild 
                        data-testid={`button-resume-activity-${activity.id}`}
                      >
                        <Link href={`/learn/${activity.courseId}`}>
                          <Play className="h-3 w-3 mr-1" />
                          Resume
                        </Link>
                      </Button>
                    </div>
                  ))}
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
                Study Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inProgressCourses.length > 0 ? (
                <div className="space-y-3">
                  {inProgressCourses.slice(0, 2).map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="p-3 rounded-lg border bg-accent/20"
                      data-testid={`reminder-${enrollment.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Continue studying</span>
                      </div>
                      <p className="text-sm mt-1 truncate">{enrollment.course?.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {100 - (enrollment.progress || 0)}% remaining
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2 w-full" 
                        asChild
                        data-testid={`button-resume-reminder-${enrollment.id}`}
                      >
                        <Link href={`/learn/${enrollment.courseId}`}>
                          <Play className="h-3 w-3 mr-1" />
                          Resume
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active courses to remind you about</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
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
              <Button variant="outline" className="w-full justify-start" asChild data-testid="button-practice-mode">
                <Link href="/practice">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Practice Mode
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild data-testid="button-flashcards">
                <Link href="/flashcards">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Flashcards
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild data-testid="button-anatomy-viewer">
                <Link href="/anatomy-viewer">
                  <Play className="h-4 w-4 mr-2" />
                  3D Anatomy Viewer
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild data-testid="button-view-certificates">
                <Link href="/certificates">
                  <Award className="h-4 w-4 mr-2" />
                  View Certificates
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
