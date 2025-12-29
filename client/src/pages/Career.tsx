import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/PageTransition";
import { AnimatedSection, StaggerContainer, AnimatedItem } from "@/components/AnimatedSection";
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

const openings = [
  {
    title: "Senior Medical Illustrator",
    location: "Remote",
    type: "Full-time",
    department: "Creative"
  },
  {
    title: "Full Stack Developer",
    location: "London, UK",
    type: "Full-time",
    department: "Engineering"
  },
  {
    title: "Content Editor - Anatomy",
    location: "New York, USA",
    type: "Contract",
    department: "Editorial"
  },
  {
    title: "3D Generalist",
    location: "Remote",
    type: "Full-time",
    department: "Creative"
  },
];

export default function Career() {
  const prefersReducedMotion = useReducedMotion();
  const valuesRef = useInViewAnimation({ threshold: 0.1 });
  const openingsRef = useInViewAnimation({ threshold: 0.1 });

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
                <Input placeholder="Search roles..." className="pl-9" data-testid="input-search-roles" />
              </div>
            </motion.div>

            <div className="space-y-4">
              {openings.map((job, index) => (
                <motion.div key={job.title} variants={fadeInUp} custom={index}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`text-job-${job.title.toLowerCase().replace(/\s/g, '-')}`}>
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
                        <Button variant="outline" className="shrink-0" data-testid={`button-apply-${job.title.toLowerCase().replace(/\s/g, '-')}`}>
                          Apply Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div className="text-center mt-8" variants={fadeInUp}>
              <Link href="/careers">
                <Button variant="link" className="gap-2" data-testid="link-archived-positions">
                  View archived positions <ChevronRight className="w-4 h-4" />
                </Button>
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
