import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Career } from "@shared/schema";
import { Layout } from "@/components/layout/Layout";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ApplicationModal } from "@/components/career/ApplicationModal";
import { MapPin, Clock, Briefcase } from "lucide-react";

// ---------------------------------------------------------------------------
// Skeleton layout while loading
// ---------------------------------------------------------------------------

function JobDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8" data-testid="job-detail-skeleton">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Header skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>

      {/* Body skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Apply button skeleton */}
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: job, isLoading, isError, error } = useQuery<Career>({
    queryKey: ["/api/careers", id],
  });

  // Redirect to /careers on 404 or inactive listing
  if (!isLoading) {
    if (isError) {
      const errMsg = error instanceof Error ? error.message : "";
      if (errMsg.startsWith("404")) {
        setLocation("/careers");
        return null;
      }
    }
    if (job && job.isActive === false) {
      setLocation("/careers");
      return null;
    }
  }

  return (
    <Layout>
      <PageTransition>
        {isLoading ? (
          <JobDetailSkeleton />
        ) : job ? (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/careers">Careers</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage data-testid="breadcrumb-job-title">{job.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Job Header */}
            <header className="space-y-4">
              <h1
                className="text-3xl md:text-4xl font-bold text-foreground"
                data-testid="job-detail-title"
              >
                {job.title}
              </h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1" data-testid="job-detail-department">
                  <Briefcase className="w-3 h-3" />
                  {job.department}
                </Badge>
                <Badge variant="outline" className="gap-1" data-testid="job-detail-location">
                  <MapPin className="w-3 h-3" />
                  {job.location}
                </Badge>
                <Badge variant="outline" className="gap-1" data-testid="job-detail-type">
                  <Clock className="w-3 h-3" />
                  {job.type}
                </Badge>
              </div>
            </header>

            {/* Job Body */}
            <section className="space-y-8">
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground">About the Role</h2>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground leading-relaxed"
                  data-testid="job-detail-description"
                >
                  {job.description}
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground">Requirements</h2>
                <ul
                  className="list-disc list-inside space-y-1 text-muted-foreground"
                  data-testid="job-detail-requirements"
                >
                  {job.requirements
                    .split("\n")
                    .map((req) => req.trim())
                    .filter(Boolean)
                    .map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                </ul>
              </div>
            </section>

            {/* Apply Now */}
            <div className="pt-4 border-t border-border">
              <Button
                size="lg"
                onClick={() => setModalOpen(true)}
                data-testid="button-apply-now"
              >
                Apply Now
              </Button>
            </div>

            {/* Application Modal */}
            <ApplicationModal
              jobId={job.id}
              jobTitle={job.title}
              open={modalOpen}
              onClose={() => setModalOpen(false)}
            />
          </div>
        ) : null}
      </PageTransition>
    </Layout>
  );
}
