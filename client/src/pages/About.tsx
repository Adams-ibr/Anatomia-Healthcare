import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Eye, 
  Shield, 
  Globe, 
  Lightbulb,
  Users,
  ArrowRight,
  Star
} from "lucide-react";

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
  { name: "Dr. Sarah Jenks", role: "Chief Editor", description: "Former surgeon with 15 years of experience in clinical anatomy education." },
  { name: "Mark Dee", role: "Lead Illustrator", description: "Award-winning medical illustrator specializing in 3D visualization." },
  { name: "James Wilson", role: "CTO", description: "Tech visionary ensuring our platform runs smoothly for millions of users." },
  { name: "Emily Chen", role: "Head of Community", description: "Connecting students and educators to foster a global learning network." },
];

export default function About() {
  return (
    <Layout>
      <section className="relative py-16 md:py-24 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-about-hero-title">
              Bridging the Gap Between Textbooks and Understanding
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Anatomia provides accessible, high-quality 3D resources to democratize medical education for everyone, everywhere.
            </p>
            <Link href="/about">
              <Button variant="secondary" data-testid="button-our-story">
                Our Story
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">OUR PURPOSE</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-why-exist-title">
              Why We Exist
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We are dedicated to making anatomical education accessible, accurate, and engaging for the next generation of medical professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
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

            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
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
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-values-title">
              Core Values
            </h2>
            <p className="text-muted-foreground">
              The principles that guide our content and technology.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value) => (
              <Card key={value.title}>
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center mb-8">
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
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <Card key={member.name}>
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-10 h-10 text-primary/50" />
                  </div>
                  <h3 className="font-semibold text-foreground" data-testid={`text-team-${member.name.toLowerCase().replace(/\s/g, '-')}`}>
                    {member.name}
                  </h3>
                  <p className="text-sm text-primary mb-2">{member.role}</p>
                  <p className="text-xs text-muted-foreground">{member.description}</p>
                  <div className="flex justify-center gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-3 h-3 fill-primary text-primary" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
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
        </div>
      </section>
    </Layout>
  );
}
