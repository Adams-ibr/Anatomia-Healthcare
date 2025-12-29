import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedSection, StaggerContainer, AnimatedItem } from "@/components/AnimatedSection";
import { PageTransition } from "@/components/PageTransition";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { useInViewAnimation } from "@/hooks/use-in-view-animation";
import { 
  Target, 
  Eye, 
  Shield, 
  Globe, 
  Lightbulb,
  ArrowRight
} from "lucide-react";

import heroAnatomyImg from "@assets/stock_images/3d_human_anatomy_mus_873f0c5b.jpg";
import doctorImg from "@assets/stock_images/doctor_professional__26ea132c.jpg";
import studentsImg from "@assets/stock_images/medical_students_stu_234d9069.jpg";

const stats = [
  { value: "5M+", label: "Active Users" },
  { value: "10k+", label: "Articles Published" },
  { value: "2.5k+", label: "3D Models" },
  { value: "150+", label: "Medical Partners" },
];

const values = [
  {
    icon: Shield,
    title: "Medical Accuracy",
    description: "Every model, article, and quiz is reviewed by certified medical professionals to ensure the highest level of anatomical precision."
  },
  {
    icon: Globe,
    title: "Global Accessibility",
    description: "We optimize our platform to work on low-bandwidth connections and older devices so students everywhere can learn."
  },
  {
    icon: Lightbulb,
    title: "Educational Innovation",
    description: "We constantly explore new ways to visualize complex biological systems, moving beyond static images to interactive learning."
  },
];

const team = [
  { name: "Dr. Sarah Jenks", role: "Chief Editor", description: "Former surgeon with 15 years of experience in clinical anatomy education.", image: doctorImg },
  { name: "Mark Dee", role: "Lead Illustrator", description: "Award-winning medical illustrator specializing in 3D visualization.", image: studentsImg },
  { name: "James Wilson", role: "CTO", description: "Tech visionary ensuring our platform runs smoothly for millions of users.", image: doctorImg },
  { name: "Emily Chen", role: "Head of Community", description: "Connecting students and educators to foster a global learning network.", image: studentsImg },
];

export default function About() {
  const prefersReducedMotion = useReducedMotion();
  const statsRef = useInViewAnimation({ threshold: 0.2 });
  const valuesRef = useInViewAnimation({ threshold: 0.1 });
  const teamRef = useInViewAnimation({ threshold: 0.1 });

  return (
    <Layout>
      <PageTransition>
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={heroAnatomyImg} 
              alt="" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary/80" />
          </div>
          <motion.div 
            className="relative max-w-7xl mx-auto px-4 sm:px-6"
            initial={prefersReducedMotion ? false : "hidden"}
            animate="visible"
            variants={staggerContainer}
          >
            <div className="max-w-3xl text-primary-foreground">
              <motion.h1 
                variants={fadeInUp}
                className="text-4xl md:text-5xl font-bold mb-6" 
                data-testid="text-about-hero-title"
              >
                Bridging the Gap Between Textbooks and Understanding
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-lg text-primary-foreground/80 mb-8">
                Anatomia provides accessible, high-quality 3D resources to democratize medical education for everyone, everywhere.
              </motion.p>
              <motion.div variants={fadeInUp}>
                <Link href="/about">
                  <Button variant="secondary" data-testid="button-our-story">
                    Our Story
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

        <motion.section 
          className="py-8 bg-card border-b border-border"
          ref={statsRef.ref}
          initial={prefersReducedMotion ? false : "hidden"}
          animate={statsRef.isInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <motion.div key={stat.label} className="text-center" variants={fadeInUp}>
                  <p className="text-3xl md:text-4xl font-bold text-primary" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <AnimatedSection className="text-center mb-12">
              <Badge variant="outline" className="mb-4">OUR PURPOSE</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-why-exist-title">
                Why We Exist
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We are dedicated to making anatomical education accessible, accurate, and engaging for the next generation of medical professionals.
              </p>
            </AnimatedSection>

            <StaggerContainer className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <AnimatedItem>
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 h-full">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">Our Mission</h3>
                    <p className="text-muted-foreground">
                      To democratize medical education through accessible, high-quality 3D resources. We believe that financial barriers shouldn't prevent anyone from understanding the human body.
                    </p>
                  </CardContent>
                </Card>
              </AnimatedItem>

              <AnimatedItem>
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 h-full">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Eye className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">Our Vision</h3>
                    <p className="text-muted-foreground">
                      A world where anatomical knowledge is accessible to everyone, everywhere. We envision a future where digital tools replace the need for expensive physical models in classrooms worldwide.
                    </p>
                  </CardContent>
                </Card>
              </AnimatedItem>
            </StaggerContainer>
          </div>
        </section>

        <motion.section 
          className="py-16 md:py-24 bg-card"
          ref={valuesRef.ref}
          initial={prefersReducedMotion ? false : "hidden"}
          animate={valuesRef.isInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div className="mb-12" variants={fadeInUp}>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-values-title">
                Core Values
              </h2>
              <p className="text-muted-foreground">
                The principles that guide our content and technology.
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

        <motion.section 
          className="py-16 md:py-24"
          ref={teamRef.ref}
          initial={prefersReducedMotion ? false : "hidden"}
          animate={teamRef.isInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div className="flex flex-wrap justify-between items-center gap-4 mb-8" variants={fadeInUp}>
              <div>
                <Badge variant="outline" className="mb-2">OUR TEAM</Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground" data-testid="text-team-title">
                  Meet the Experts
                </h2>
                <p className="text-muted-foreground mt-2">
                  A diverse group of doctors, illustrators, and developers passionate about education.
                </p>
              </div>
              <Link href="/careers">
                <Button variant="ghost" className="gap-2 hidden md:flex" data-testid="link-view-all-members">
                  View all members <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <motion.div key={member.name} variants={fadeInUp} custom={index}>
                  <Card className="overflow-hidden h-full">
                    <CardContent className="p-0">
                      <div className="aspect-square overflow-hidden">
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 text-center">
                        <h3 className="font-semibold text-foreground" data-testid={`text-team-${member.name.toLowerCase().replace(/\s/g, '-')}`}>
                          {member.name}
                        </h3>
                        <p className="text-sm text-primary mb-2">{member.role}</p>
                        <p className="text-xs text-muted-foreground">{member.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section 
          className="py-16 md:py-24 bg-primary text-primary-foreground"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <AnimatedSection>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-about-cta-title">
                Ready to deepen your understanding?
              </h2>
              <p className="text-primary-foreground/80 mb-8">
                Join over 5 million students and professionals mastering human anatomy with our free resources.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/services">
                  <Button size="lg" variant="secondary" data-testid="button-start-learning-now">
                    Start Learning Now
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" data-testid="button-contact-support">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </motion.section>
      </PageTransition>
    </Layout>
  );
}
