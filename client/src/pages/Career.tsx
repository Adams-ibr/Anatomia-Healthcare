import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Career as CareerType } from "@shared/schema";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/layout/Layout";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PageTransition } from "@/components/PageTransition";
import { AnimatedSection } from "@/components/AnimatedSection";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { useInViewAnimation } from "@/hooks/use-in-view-animation";
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
  Search,
  Heart,
  Users,
  ChevronRight
} from "lucide-react";

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
  const valuesRef = useInViewAnimation({ threshold: 0.1 });
  const openingsRef = useInViewAnimation({ threshold: 0.1 });
  
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  const applyMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/applications", data),
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Thank you for applying! We'll review your application and get back to you soon.",
      });
      setApplyingJobId(null);
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleApply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!applyingJobId) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      jobId: applyingJobId,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      location: formData.get("location") as string,
      experience: parseInt(formData.get("experience") as string) || 0,
      startDate: formData.get("startDate") as string,
      portfolioUrl: formData.get("portfolio") as string,
      coverLetter: formData.get("coverLetter") as string,
      resumeUrl: "Pending Upload System", // Mock for now
    };

    applyMutation.mutate(data);
  };

  const { data: fetchedJobs, isLoading } = useQuery<CareerType[]>({
    queryKey: ["/api/careers"],
  });

  const activeJobs = fetchedJobs?.filter(job => job.isActive) || [];

  const displayedJobs = activeJobs.filter(job => {
    const titleMatch = (job.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    const deptMatch = (job.department || "").toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || deptMatch;
  });

  return (
    <Layout>
      <PageTransition>
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={prefersReducedMotion ? false : "hidden"}
                animate="visible"
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
                  <Button size="lg" data-testid="button-view-positions">
                    View Open Positions
                  </Button>
                </motion.div>
              </motion.div>
              <motion.div
                className="relative"
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
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

        <motion.section
          className="py-16 bg-card"
          ref={valuesRef.ref}
          initial={prefersReducedMotion ? false : "hidden"}
          animate={valuesRef.isInView ? "visible" : "hidden"}
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
              {values.map((value, index) => (
                <motion.div key={value.title} variants={fadeInUp} custom={index}>
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <value.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <AnimatedSection>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4" data-testid="text-benefits-title">
                  Employee Benefits
                </h2>
                <p className="text-muted-foreground mb-8">
                  We take care of our team so they can take care of our community. Our benefits package is designed to support your well-being and growth.
                </p>
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                  <Heart className="w-16 h-16 text-primary/30" />
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.1}>
                <Accordion type="single" collapsible className="w-full">
                  {benefits.map((benefit, index) => (
                    <AccordionItem key={benefit.title} value={`item-${index}`}>
                      <AccordionTrigger className="text-left" data-testid={`accordion-benefit-${index}`}>
                        {benefit.title}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {benefit.description}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <motion.section
          className="py-16 bg-card"
          ref={openingsRef.ref}
          initial={prefersReducedMotion ? false : "hidden"}
          animate={openingsRef.isInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div
              className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
              variants={fadeInUp}
            >
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-openings-title">
                  Current Openings
                </h2>
                <p className="text-muted-foreground">Join us in shaping the future.</p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search roles..." 
                  className="pl-9" 
                  data-testid="input-search-roles" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>

            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading open positions...</div>
              ) : displayedJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No open positions currently available.</div>
              ) : (
                displayedJobs.map((job, index) => (
                  <motion.div key={job.id} variants={fadeInUp} custom={index}>
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
                          <Button 
                            variant="outline" 
                            className="shrink-0" 
                            data-testid={`button-apply-${(job.title || '').toLowerCase().replace(/\s/g, '-')}`}
                            onClick={() => setApplyingJobId(job.id)}
                          >
                            Apply Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>

            <Dialog open={applyingJobId !== null} onOpenChange={(open) => !open && setApplyingJobId(null)}>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Application Form</DialogTitle>
                  <DialogDescription>
                    Please provide your details to apply for this position. All fields are required unless marked as optional.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleApply} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" name="name" required placeholder="Jane Doe" disabled={applyMutation.isPending} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" name="email" type="email" required placeholder="jane@example.com" disabled={applyMutation.isPending} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" name="phone" type="tel" required placeholder="+1 (555) 000-0000" disabled={applyMutation.isPending} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Current Location</Label>
                      <Input id="location" name="location" required placeholder="City, Country" disabled={applyMutation.isPending} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input id="experience" name="experience" type="number" min="0" required placeholder="e.g. 5" disabled={applyMutation.isPending} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Available Start Date</Label>
                      <Input id="startDate" name="startDate" type="date" required disabled={applyMutation.isPending} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resume">Resume / CV</Label>
                    <Input id="resume" name="resume" type="file" accept=".pdf,.doc,.docx" required className="cursor-pointer" disabled={applyMutation.isPending} />
                    <p className="text-xs text-muted-foreground">Accepted formats: PDF, DOC, DOCX (Max 5MB)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio / LinkedIn URL (Optional)</Label>
                    <Input id="portfolio" name="portfolio" type="url" placeholder="https://..." disabled={applyMutation.isPending} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coverLetter">Cover Letter</Label>
                    <Textarea id="coverLetter" name="coverLetter" required placeholder="Tell us why you're a great fit for this role and what excites you about Anatomia..." className="min-h-[120px]" disabled={applyMutation.isPending} />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setApplyingJobId(null)} disabled={applyMutation.isPending}>Cancel</Button>
                    <Button type="submit" disabled={applyMutation.isPending}>
                      {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <motion.div className="text-center mt-8" variants={fadeInUp}>
              <Link href="/careers" className={buttonVariants({ variant: "link", className: "gap-2" })} data-testid="link-archived-positions">
                View archived positions <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="py-16"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <AnimatedSection>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4" data-testid="text-no-right-role-title">
                Don't see the right role?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                We are always looking for talented individuals to join our team. If you are passionate about medical education but don't see a role that fits, we'd still love to hear from you.
              </p>
              <Button size="lg" data-testid="button-email-cv">
                Email your CV
              </Button>
            </AnimatedSection>
          </div>
        </motion.section>
      </PageTransition>
    </Layout>
  );
}
