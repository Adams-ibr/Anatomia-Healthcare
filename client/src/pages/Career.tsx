import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { Career as CareerType } from "@shared/schema";
import { useState } from "react";
import { getQueryFn } from "@/lib/queryClient";
import { Layout } from "@/components/layout/Layout";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/PageTransition";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  GraduationCap,
  Globe,
  Lightbulb,
  MapPin,
  Clock,
  Briefcase,
  Mail,
  Heart,
  Users,
  ChevronRight
} from "lucide-react";
import { FilterPanel } from "@/components/career/FilterPanel";
import { ApplicationModal } from "@/components/career/ApplicationModal";
import { filterCareers, type CareerFilters } from "@/lib/careerFilters";

const EMPTY_FILTERS: CareerFilters = {
  department: "",
  location: "",
  type: "",
  search: "",
};

const values = [
  {
    icon: GraduationCap,
    title: "Educational Impact",
    description: "Your work will directly help millions of medical students and professionals worldwide master complex anatomy."
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Join a diverse, remote-friendly team that spans across continents, cultures, and time zones."
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "Work with cutting-edge 3D technology, WebGL, and pedagogical strategies to redefine learning."
  },
];

const benefits = [
  {
    title: "Healthcare & Wellness",
    description: "We offer top-tier medical, dental, and vision coverage for you and your dependents, including mental health support and gym stipends."
  },
  {
    title: "Flexible Remote Work",
    description: "Work from anywhere in the world. We trust you to manage your schedule and location."
  },
  {
    title: "Learning Budget",
    description: "Annual stipend for courses, books, and conferences to support your professional growth."
  },
];

export default function Career() {
  const prefersReducedMotion = useReducedMotion();

  const [filters, setFilters] = useState<CareerFilters>(EMPTY_FILTERS);
  const [applyingJob, setApplyingJob] = useState<{ id: string; title: string } | null>(null);

  const { data: fetchedJobs, isLoading } = useQuery<CareerType[]>({
    queryKey: ["/api/careers"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const activeJobs = fetchedJobs?.filter(job => job.isActive) || [];
  const displayedJobs = filterCareers(activeJobs, filters);

  const hasActiveFilters =
    filters.department !== "" ||
    filters.location !== "" ||
    filters.type !== "" ||
    filters.search !== "";

  const viewportConfig = { once: true, margin: "-50px" };

  return (
    <Layout>
      <PageTransition>
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={prefersReducedMotion ? false : "hidden"}
                whileInView="visible"
                viewport={viewportConfig}
                variants={staggerContainer}
              >
                <motion.h1
                  variants={fadeInUp}
                  className="text-4xl md:text-5xl font-bold text-foreground mb-6"
                  data-testid="text-career-hero-title"
                >
                  Build the Future of Medical Education
                </motion.h1>
                <motion.p variants={fadeInUp} className="text-lg text-muted-foreground mb-8">
                  Join the Anatomia team and help us make anatomy accessible to everyone, everywhere. We are looking for passionate individuals to drive innovation in medical learning.
                </motion.p>
                <motion.div variants={fadeInUp}>
                  <Button size="lg" data-testid="button-view-positions" onClick={() => document.getElementById('openings')?.scrollIntoView({ behavior: 'smooth' })}>
                    View Open Positions
                  </Button>
                </motion.div>
              </motion.div>
              <motion.div
                className="relative"
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={viewportConfig}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                  <div className="text-center p-8">
                    <Users className="w-16 h-16 text-primary/50 mx-auto mb-4" />
                    <p className="text-sm font-medium text-primary">Innovating Learning</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <motion.section
          className="py-16 bg-card"
          initial={prefersReducedMotion ? false : "hidden"}
          whileInView="visible"
          viewport={viewportConfig}
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div className="mb-12" variants={fadeInUp}>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4" data-testid="text-why-join-title">
                Why Join Us
              </h2>
              <p className="text-muted-foreground">
                We foster a culture of curiosity, precision, and impact.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <motion.div key={value.title} variants={fadeInUp} custom={index}>
                    <Card className="h-full">
                      <CardContent className="p-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                        <p className="text-sm text-muted-foreground">{value.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* Benefits Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <motion.div
                initial={prefersReducedMotion ? false : "hidden"}
                whileInView="visible"
                viewport={viewportConfig}
                variants={staggerContainer}
              >
                <motion.h2 variants={fadeInUp} className="text-2xl md:text-3xl font-bold text-foreground mb-4" data-testid="text-benefits-title">
                  Employee Benefits
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-muted-foreground mb-8">
                  We take care of our team so they can take care of our community. Our benefits package is designed to support your well-being and growth.
                </motion.p>
                <motion.div variants={fadeInUp} className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                  <Heart className="w-16 h-16 text-primary/30" />
                </motion.div>
              </motion.div>

              <motion.div
                initial={prefersReducedMotion ? false : "hidden"}
                whileInView="visible"
                viewport={viewportConfig}
                variants={staggerContainer}
              >
                <Accordion type="single" collapsible className="w-full">
                  {benefits.map((benefit, index) => (
                    <motion.div variants={fadeInUp} custom={index} key={benefit.title}>
                      <AccordionItem value={`item-${index}`}>
                        <AccordionTrigger className="text-left" data-testid={`accordion-benefit-${index}`}>
                          {benefit.title}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {benefit.description}
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </Accordion>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Openings Section */}
        <motion.section
          id="openings"
          className="py-16 bg-card"
          initial={prefersReducedMotion ? false : "hidden"}
          whileInView="visible"
          viewport={viewportConfig}
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div
              className="mb-6"
              variants={fadeInUp}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1" data-testid="text-openings-title">
                Current Openings
              </h2>
              <p className="text-muted-foreground mb-6">Join us in shaping the future.</p>

              {/* Filter Panel */}
              <FilterPanel
                careers={activeJobs}
                filters={filters}
                onChange={setFilters}
                matchCount={displayedJobs.length}
                isLoading={isLoading}
              />
            </motion.div>

            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading open positions...</div>
              ) : displayedJobs.length === 0 && hasActiveFilters ? (
                <div className="text-center py-8" data-testid="no-filter-results">
                  <p className="text-muted-foreground mb-4">No positions match your filters.</p>
                  <Button
                    variant="outline"
                    onClick={() => setFilters(EMPTY_FILTERS)}
                    data-testid="button-clear-filters"
                  >
                    Clear filters
                  </Button>
                </div>
              ) : displayedJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No open positions currently available.</div>
              ) : (
                displayedJobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`text-job-${(job.title || '').toLowerCase().replace(/\s/g, '-')}`}>
                              {job.title}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="gap-1">
                                <MapPin className="w-3 h-3" />
                                {job.location}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Clock className="w-3 h-3" />
                                {job.type}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Briefcase className="w-3 h-3" />
                                {job.department}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Link href={`/careers/${job.id}`}>
                              <a
                                className={buttonVariants({ variant: "outline" })}
                                data-testid={`link-view-details-${job.id}`}
                              >
                                View Details
                              </a>
                            </Link>
                            <Button
                              variant="default"
                              data-testid={`button-apply-${(job.title || '').toLowerCase().replace(/\s/g, '-')}`}
                              onClick={() => setApplyingJob({ id: job.id, title: job.title })}
                            >
                              Apply Now
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>

            {/* Application Modal */}
            {applyingJob && (
              <ApplicationModal
                jobId={applyingJob.id}
                jobTitle={applyingJob.title}
                open={applyingJob !== null}
                onClose={() => setApplyingJob(null)}
              />
            )}

            <motion.div className="text-center mt-8" variants={fadeInUp}>
              <Link href="/careers">
                <a className={buttonVariants({ variant: "link", className: "gap-2" })} data-testid="link-archived-positions">
                  View archived positions <ChevronRight className="w-4 h-4" />
                </a>
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          className="py-16"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportConfig}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-primary" />
              </motion.div>
              <motion.h2 variants={fadeInUp} className="text-2xl md:text-3xl font-bold text-foreground mb-4" data-testid="text-no-right-role-title">
                Don't see the right role?
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                We are always looking for talented individuals to join our team. If you are passionate about medical education but don't see a role that fits, we'd still love to hear from you.
              </motion.p>
              <motion.div variants={fadeInUp}>
                <Button size="lg" data-testid="button-email-cv">
                  Email your CV
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      </PageTransition>
    </Layout>
  );
}
