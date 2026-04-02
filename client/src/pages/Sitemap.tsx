import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search,
  BookOpen,
  Brain,
  Heart,
  Bone,
  Hand,
  Footprints,
  Stethoscope,
  Building2,
  Filter
} from "lucide-react";

const quickJump = ["Basics", "Head & Neck", "Thorax", "Abdomen", "Limbs", "Clinical"];

const sections = [
  {
    icon: BookOpen,
    title: "Anatomical Basics",
    links: ["Introduction to Anatomy", "Anatomical Terminology", "Embryology Overview", "Histology Basics", "Body Systems Overview", "Imaging Techniques"]
  },
  {
    icon: Brain,
    title: "Head & Neck",
    links: ["The Skull & Cranium", "Cranial Nerves (I-XII)", "Muscles of Mastication", "The Neck & Pharynx", "The Eye & Orbit", "The Ear", "Blood Supply of Head"]
  },
  {
    icon: Heart,
    title: "Thorax",
    links: ["The Thoracic Cage", "The Heart & Pericardium", "The Lungs & Pleura", "The Mediastinum", "Vessels of the Thorax", "Diaphragm", "Breast Anatomy"]
  },
  {
    icon: Bone,
    title: "Abdomen & Pelvis",
    links: ["Abdominal Wall", "Gastrointestinal Tract", "Liver & Gallbladder", "Kidneys & Ureters", "Male Reproductive", "Female Reproductive", "Perineum"]
  },
  {
    icon: Hand,
    title: "Upper Limb",
    links: ["The Shoulder Region", "The Axilla", "The Arm & Elbow", "The Forearm", "The Hand & Wrist", "Brachial Plexus"]
  },
  {
    icon: Footprints,
    title: "Lower Limb",
    links: ["The Gluteal Region", "The Hip & Thigh", "The Knee & Popliteal Fossa", "The Leg", "The Foot & Ankle", "Lumbosacral Plexus"]
  },
  {
    icon: Stethoscope,
    title: "Clinical Zones",
    links: ["Common Pathologies", "Surgical Anatomy", "Radiological Anatomy", "Clinical Case Studies", "Interactive Quizzes", "3D Model Library"]
  },
  {
    icon: Building2,
    title: "Anatomia Company",
    links: ["About Us", "Our Team", "Contact Support", "Premium Plans", "Donate", "Privacy Policy", "Terms of Service"]
  },
];

export default function Sitemap() {
  return (
    <Layout>
      <section className="py-8 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-foreground">Sitemap</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2" data-testid="text-sitemap-title">
            Sitemap
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            A complete overview of all anatomical topics, systems, and pages available on Anatomia.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative mb-8">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Filter sitemap links..."
              className="pl-12"
              data-testid="input-filter-sitemap"
            />
          </div>

          <Card className="mb-12">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">Quick Jump</h3>
                  <p className="text-sm text-muted-foreground">Navigate directly to a major anatomical region</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickJump.map((item, index) => (
                    <Button 
                      key={item} 
                      variant={index === 0 ? "default" : "outline"} 
                      size="sm"
                      data-testid={`button-quick-${item.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      {item}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {sections.map((section) => (
              <div key={section.title}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <section.icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{section.title}</h3>
                </div>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link}>
                      <Link 
                        href={`/${link.toLowerCase().replace(/\s/g, '-')}`}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        data-testid={`link-${link.toLowerCase().replace(/\s/g, '-')}`}
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
