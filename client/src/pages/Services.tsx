import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search,
  Monitor,
  Box,
  Headphones,
  Building2,
  HelpCircle,
  Phone,
  ArrowRight,
  ChevronRight,
  Layers
} from "lucide-react";

import heroAnatomyImg from "@assets/stock_images/3d_human_anatomy_mus_873f0c5b.jpg";
import heartImg from "@assets/stock_images/human_heart_anatomy__701f24b0.jpg";
import brainImg from "@assets/stock_images/human_brain_anatomy__282b70de.jpg";
import eyeImg from "@assets/stock_images/human_eye_anatomy_cl_a34cfb66.jpg";
import skeletonImg from "@assets/stock_images/human_skeleton_medic_56e01afd.jpg";
import studentsImg from "@assets/stock_images/medical_students_stu_234d9069.jpg";

const categories = [
  { icon: Layers, label: "All Products", active: true },
  { icon: Monitor, label: "Digital Atlases" },
  { icon: Box, label: "Physical Models" },
  { icon: Headphones, label: "VR/AR Software" },
  { icon: Building2, label: "Institutional Licensing" },
];

const products = [
  {
    title: "Complete Anatomy 2024",
    category: "DIGITAL ATLAS",
    description: "The world's most accurate and advanced 3D anatomy platform...",
    price: "$34.99/yr",
    badge: "BESTSELLER",
    badgeColor: "bg-primary",
    image: heroAnatomyImg
  },
  {
    title: "Deluxe Heart Model",
    category: "PHYSICAL MODEL",
    description: "2-part life-size heart model with removable front wall to show...",
    price: "$129.00",
    badge: null,
    badgeColor: null,
    image: heartImg
  },
  {
    title: "Neuro VR Lab",
    category: "VR SOFTWARE",
    description: "Immersive virtual reality experience for neuroanatomy...",
    price: "Contact Sales",
    badge: "NEW",
    badgeColor: "bg-green-500",
    image: brainImg
  },
  {
    title: "Ophthalmology Suite",
    category: "DIGITAL ATLAS",
    description: "Detailed cross-sections and pathologies of the human eye...",
    price: "$19.99/mo",
    badge: null,
    badgeColor: null,
    image: eyeImg
  },
  {
    title: "Premium Skeleton",
    category: "PHYSICAL MODEL",
    description: "Full-size articulated skeleton with muscle insertion and origin poin...",
    price: "$299.00",
    badge: null,
    badgeColor: null,
    image: skeletonImg
  },
  {
    title: "University Enterprise",
    category: "LICENSING",
    description: "Site-wide licensing for medical schools and teaching hospitals...",
    price: "Custom Quote",
    badge: null,
    badgeColor: null,
    image: studentsImg
  },
];

export default function Services() {
  return (
    <Layout>
      <section className="py-12 md:py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src={heroAnatomyImg} 
            alt="" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="aspect-video rounded-xl overflow-hidden shadow-2xl">
              <img 
                src={heroAnatomyImg} 
                alt="3D Anatomy Model" 
                className="w-full h-full object-cover"
                data-testid="img-services-hero"
              />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-services-hero-title">
                Comprehensive Anatomy Solutions
              </h1>
              <p className="text-lg text-gray-300 mb-8">
                Explore our suite of educational tools, 3D models, and institutional software designed for medical professionals and students.
              </p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    placeholder="Find models, courses, tools..." 
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    data-testid="input-search-products"
                  />
                </div>
                <Button data-testid="button-search-products">Search</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/services" className="hover:text-primary transition-colors">Products</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">All Solutions</span>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-4 gap-8">
            <aside className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-4">Categories</h3>
                  <p className="text-sm text-muted-foreground mb-4">Browse by Type</p>
                  <nav className="space-y-1">
                    {categories.map((cat) => (
                      <Button
                        key={cat.label}
                        variant={cat.active ? "default" : "ghost"}
                        className="w-full justify-start gap-2"
                        size="sm"
                        data-testid={`button-cat-${cat.label.toLowerCase().replace(/\s/g, '-')}`}
                      >
                        <cat.icon className="w-4 h-4" />
                        {cat.label}
                      </Button>
                    ))}
                  </nav>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Support</h4>
                <Link href="/faq">
                  <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" size="sm">
                    <HelpCircle className="w-4 h-4" />
                    Help Center
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" size="sm">
                    <Phone className="w-4 h-4" />
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </aside>

            <div className="lg:col-span-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-foreground" data-testid="text-featured-solutions">
                  Featured Solutions
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  <Select defaultValue="popularity">
                    <SelectTrigger className="w-32" data-testid="select-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popularity">Popularity</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price-low">Price: Low</SelectItem>
                      <SelectItem value="price-high">Price: High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.title} className="group cursor-pointer transition-all duration-300 hover:shadow-lg overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-square relative overflow-hidden">
                        <img 
                          src={product.image} 
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {product.badge && (
                          <Badge className={`absolute top-3 left-3 ${product.badgeColor} text-white`}>
                            {product.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-primary font-medium mb-1">{product.category}</p>
                        <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {product.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{product.price}</span>
                          <Button variant="ghost" size="sm" className="gap-1 text-primary" data-testid={`button-learn-more-${product.title.toLowerCase().replace(/\s/g, '-')}`}>
                            Learn More <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center mt-12">
                <Button variant="outline" className="gap-2" data-testid="button-load-more">
                  Load More Products <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
