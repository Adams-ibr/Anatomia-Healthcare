import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Home, BookOpen } from "lucide-react";

import skeletonImg from "@assets/stock_images/human_skeleton_medic_56e01afd.jpg";

export default function NotFound() {
  return (
    <Layout>
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="aspect-square max-w-xs mx-auto rounded-xl overflow-hidden shadow-lg">
                <img 
                  src={skeletonImg} 
                  alt="Anatomy Skeleton" 
                  className="w-full h-full object-cover"
                  data-testid="img-404-skeleton"
                />
              </div>
            </div>

            <div className="order-1 md:order-2 text-center md:text-left">
              <h1 className="text-7xl md:text-8xl font-bold text-primary/20 mb-4" data-testid="text-404">
                404
              </h1>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-not-found-title">
                Anatomy Not Found
              </h2>
              <p className="text-muted-foreground mb-8">
                The page you are looking for might have been amputated, or maybe it's just temporarily paralyzed. Don't worry, even doctors lose their way sometimes.
              </p>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="Search for muscles, bones, nerves..."
                  className="pl-12"
                  data-testid="input-search-404"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link href="/">
                  <Button className="gap-2 w-full sm:w-auto" data-testid="button-return-home">
                    <Home className="w-4 h-4" />
                    Return to Home
                  </Button>
                </Link>
                <Link href="/sitemap">
                  <Button variant="outline" className="gap-2 w-full sm:w-auto" data-testid="button-browse-topics">
                    <BookOpen className="w-4 h-4" />
                    Browse Topics
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
