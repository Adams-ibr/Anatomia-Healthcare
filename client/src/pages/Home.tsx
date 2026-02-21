import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedSection, StaggerContainer, AnimatedItem } from "@/components/AnimatedSection";
import { PageTransition } from "@/components/PageTransition";
import { fadeInUp, fadeInLeft, fadeInRight, staggerContainer } from "@/lib/motion";
import { useInViewAnimation } from "@/hooks/use-in-view-animation";
import {
  GraduationCap,
  Building2,
  FlaskConical,
  Stethoscope,
  RotateCcw,
  Layers,
  Monitor,
  Check,
  Clock,
  ArrowRight,
  Scissors,
  Video,
  BookOpen
} from "lucide-react";

import heroAnatomyImg from "@assets/stock_images/3d_human_anatomy_mus_873f0c5b.jpg";
import armImg from "@assets/stock_images/human_arm_muscles_an_9d7db348.jpg";
import legImg from "@assets/stock_images/human_leg_muscles_an_357c0b04.jpg";
import skullImg from "@assets/stock_images/human_skeleton_medic_56e01afd.jpg";
import torsoImg from "@assets/stock_images/human_torso_chest_an_152c69d9.jpg";
import spineImg from "@assets/stock_images/human_spine_vertebra_b5200c9c.jpg";
import pelvisImg from "@assets/stock_images/human_pelvis_hip_ana_160d6786.jpg";
import heartImg from "@assets/stock_images/human_heart_anatomy__701f24b0.jpg";
import brainImg from "@assets/stock_images/human_brain_anatomy__282b70de.jpg";

const trustedBy = [
  { icon: GraduationCap, label: "Medical Schools" },
  { icon: Building2, label: "Hospitals" },
  { icon: FlaskConical, label: "Research Labs" },
  { icon: Stethoscope, label: "Nursing Programs" },
];

const regions = [
  { title: "Upper Limb", description: "Shoulder, Arm, Elbow, Forearm, Hand", image: armImg, badge: "REGION" },
  { title: "Lower Limb", description: "Hip, Thigh, Knee, Leg, Ankle, Foot", image: legImg, badge: "REGION" },
  { title: "Head & Neck", description: "Skull, Face, Neck, Cranial Nerves", image: skullImg, badge: "REGION" },
  { title: "Thorax", description: "Heart, Lungs, Mediastinum, Ribcage", image: torsoImg, badge: "REGION" },
  { title: "Abdomen", description: "Digestive Tract, Liver, Kidneys, Spleen", image: spineImg, badge: "REGION" },
  { title: "Pelvis", description: "Reproductive Organs, Bladder, Perineum", image: pelvisImg, badge: "REGION" },
];

const features3D = [
  { icon: RotateCcw, text: "Real-time 360° rotation" },
  { icon: Layers, text: "Layer peeling (skin to bone)" },
  { icon: Monitor, text: "Works on all devices" },
];

const model3DItems = [
  { label: "Joint Systems", image: armImg },
  { label: "Muscular System", image: heroAnatomyImg },
  { label: "Organ Systems", image: heartImg },
  { label: "Skeletal System", image: skullImg },
];

const articles = [
  {
    category: "NERVES",
    title: "The Brachial Plexus Explained",
    readTime: "5 min read",
    image: brainImg
  },
  {
    category: "VASCULAR",
    title: "Circle of Willis: Anatomy & Function",
    readTime: "4 min read",
    image: heartImg
  },
  {
    category: "JOINTS",
    title: "Cruciate Ligaments of the Knee",
    readTime: "6 min read",
    image: legImg
  },
];

const cadavericFeatures = [
  { icon: Video, text: "HD video recordings of real dissections" },
  { icon: Scissors, text: "Step-by-step surgical techniques" },
  { icon: BookOpen, text: "Detailed anatomical annotations" },
];

function AnimatedCard({ children, index }: { children: React.ReactNode; index: number }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1 }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const prefersReducedMotion = useReducedMotion();
  const heroRef = useInViewAnimation({ threshold: 0.1 });
  const trustedRef = useInViewAnimation({ threshold: 0.2 });
  const featuresRef = useInViewAnimation({ threshold: 0.1 });

  return (
    <Layout>
      <PageTransition>
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
          {/* Video Background */}
          <div className="absolute inset-0 z-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover grayscale-[0.2] brightness-[0.7]"
              poster={heroAnatomyImg}
            >
              <source
                src="https://assets.mixkit.co/videos/preview/mixkit-human-skeleton-rotation-animation-43180-large.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={prefersReducedMotion ? false : "hidden"}
                animate="visible"
                variants={staggerContainer}
                className="max-w-2xl"
              >
                <motion.div
                  variants={fadeInUp}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md mb-6"
                >
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-bold tracking-wider text-primary uppercase">
                    Trusted by 500,000+ Students
                  </span>
                </motion.div>

                <motion.h1
                  variants={fadeInUp}
                  className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-[1.1] mb-6"
                  data-testid="text-hero-title"
                >
                  Experience <span className="text-primary italic">Anatomy</span> like never before.
                </motion.h1>

                <motion.p
                  variants={fadeInUp}
                  className="text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed"
                  data-testid="text-hero-description"
                >
                  The world's most comprehensive 3D interactive atlas for medical students and professionals. Master the human body with stunning detail and accuracy.
                </motion.p>

                <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                  <Link href="/services">
                    <Button size="lg" className="h-14 px-8 text-lg rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all font-bold" data-testid="button-start-learning">
                      Start Learning Free
                    </Button>
                  </Link>
                  <Link href="/services">
                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-xl border-2 backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-all font-bold" data-testid="button-browse-atlas">
                      Browse Atlas
                    </Button>
                  </Link>
                </motion.div>

                {/* Quick Stats/Features floating tags */}
                <motion.div variants={fadeInUp} className="mt-12 flex items-center gap-6 pt-8 border-t border-border/50">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold">1,200+</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest">3D Models</span>
                  </div>
                  <div className="h-8 w-[1px] bg-border" />
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold">500k+</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest">Active Users</span>
                  </div>
                  <div className="h-8 w-[1px] bg-border" />
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold">4.9/5</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest">User Rating</span>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                className="hidden lg:block relative"
                initial={prefersReducedMotion ? false : { opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                {/* Modern visual element - floating card */}
                <div className="relative z-10 p-4 border border-white/20 rounded-[2rem] bg-white/5 backdrop-blur-xl shadow-2xl">
                  <div className="aspect-[4/5] rounded-[1.5rem] overflow-hidden">
                    <img
                      src={heroAnatomyImg}
                      alt="3D Human Anatomy"
                      className="w-full h-full object-cover grayscale-[0.3] hover:grayscale-0 transition-all duration-700"
                    />
                  </div>
                  <div className="absolute -bottom-6 -left-6 p-6 rounded-2xl bg-white dark:bg-card border border-border shadow-2xl max-w-[200px] animate-bounce-subtle">
                    <p className="text-sm font-bold mb-1 italic">Real-time Rendering</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Powered by 3D Engine V2.0</p>
                  </div>
                </div>
                {/* Decorative background shapes */}
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 blur-[120px] rounded-full" />
              </motion.div>
            </div>
          </div>
        </section>

        <motion.section
          className="py-8 border-b border-border bg-card/50"
          ref={trustedRef.ref}
          initial={prefersReducedMotion ? false : "hidden"}
          animate={trustedRef.isInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              {trustedBy.map((item, i) => (
                <motion.div
                  key={item.label}
                  className="flex items-center gap-2 text-muted-foreground"
                  variants={fadeInUp}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <AnimatedSection className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-browse-title">
                Browse by Region
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Start your journey by selecting an anatomical region. Each section contains detailed articles, diagrams, and quizzes.
              </p>
            </AnimatedSection>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {regions.map((region, index) => (
                <AnimatedCard key={region.title} index={index}>
                  <Link href="/services">
                    <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="aspect-square relative overflow-hidden">
                          <img
                            src={region.image}
                            alt={region.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <Badge variant="secondary" className="absolute top-3 left-3 text-xs">{region.badge}</Badge>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-foreground mb-1" data-testid={`text-region-${region.title.toLowerCase().replace(/\s/g, '-')}`}>
                            {region.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">{region.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                ref={featuresRef.ref}
                initial={prefersReducedMotion ? false : "hidden"}
                animate={featuresRef.isInView ? "visible" : "hidden"}
                variants={staggerContainer}
              >
                <motion.div variants={fadeInUp}>
                  <Badge variant="outline" className="mb-4">NEW FEATURE</Badge>
                </motion.div>
                <motion.h2
                  variants={fadeInUp}
                  className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                  data-testid="text-3d-title"
                >
                  Interactive<br />3D Models
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-muted-foreground mb-6">
                  Visualize complex anatomical structures in 3D. Rotate, zoom, and dissect to understand spatial relationships better than ever before. Forget flat diagrams; experience anatomy as it truly is.
                </motion.p>
                <motion.ul variants={fadeInUp} className="space-y-3 mb-8">
                  {features3D.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-3 text-foreground">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      {feature.text}
                    </li>
                  ))}
                </motion.ul>
                <motion.div variants={fadeInUp}>
                  <Link href="/services">
                    <Button data-testid="button-try-demo">
                      Try 3D Demo Now
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
              <StaggerContainer className="grid grid-cols-2 gap-4">
                {model3DItems.map((item, index) => (
                  <AnimatedItem key={item.label}>
                    <Card className="aspect-square overflow-hidden relative group">
                      <img
                        src={item.image}
                        alt={item.label}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-sm font-medium text-white">{item.label}</p>
                      </div>
                    </Card>
                  </AnimatedItem>
                ))}
              </StaggerContainer>
            </div>
          </div>
        </section>

        {/* Cadaveric Dissection Section */}
        <section className="py-16 md:py-24 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="aspect-square overflow-hidden relative group">
                    <img
                      src={torsoImg}
                      alt="Cadaveric Dissection"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-medium text-white">Thorax Dissection</p>
                    </div>
                  </Card>
                  <Card className="aspect-square overflow-hidden relative group">
                    <img
                      src={armImg}
                      alt="Upper Limb Dissection"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-medium text-white">Upper Limb</p>
                    </div>
                  </Card>
                  <Card className="aspect-square overflow-hidden relative group">
                    <img
                      src={legImg}
                      alt="Lower Limb Dissection"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-medium text-white">Lower Limb</p>
                    </div>
                  </Card>
                  <Card className="aspect-square overflow-hidden relative group">
                    <img
                      src={skullImg}
                      alt="Head & Neck Dissection"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-medium text-white">Head & Neck</p>
                    </div>
                  </Card>
                </div>
              </div>
              <AnimatedSection className="order-1 lg:order-2">
                <Badge variant="outline" className="mb-4">FOR PROFESSIONALS</Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-cadaveric-title">
                  Cadaveric<br />Dissection Videos
                </h2>
                <p className="text-muted-foreground mb-6">
                  Experience real cadaveric dissections from top medical institutions. Perfect for medical professionals and advanced students seeking hands-on anatomical knowledge without the lab.
                </p>
                <ul className="space-y-3 mb-8">
                  {cadavericFeatures.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-3 text-foreground">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <feature.icon className="w-4 h-4 text-primary" />
                      </div>
                      {feature.text}
                    </li>
                  ))}
                </ul>
                <Link href="/subscribe">
                  <Button data-testid="button-access-dissection">
                    Get Professional Access
                  </Button>
                </Link>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <AnimatedSection className="flex flex-wrap justify-between items-center gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-articles-title">
                Latest Articles
              </h2>
              <Link href="/blog">
                <Button variant="ghost" className="gap-2" data-testid="link-view-all-articles">
                  View all articles <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </AnimatedSection>
            <div className="grid md:grid-cols-3 gap-6">
              {articles.map((article, index) => (
                <AnimatedCard key={article.title} index={index}>
                  <Link href="/blog">
                    <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg overflow-hidden">
                      <CardContent className="p-0">
                        <div className="h-40 overflow-hidden">
                          <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-4">
                          <Badge variant="secondary" className="mb-2 text-xs">{article.category}</Badge>
                          <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {article.title}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {article.readTime}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </section>

        <motion.section
          className="py-16 md:py-24 bg-primary text-primary-foreground"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <AnimatedSection>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-cta-title">
                Ready to Master Anatomy?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Join over 500,000 students and professionals who trust Anatomia for their anatomy learning needs.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/services">
                  <Button size="lg" variant="secondary" data-testid="button-get-started-free">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" data-testid="button-contact-sales">
                    Contact Sales
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
