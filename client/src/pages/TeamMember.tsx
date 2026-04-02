import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { PageTransition } from "@/components/PageTransition";
import { AnimatedSection } from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, Mail, Linkedin, Twitter, Facebook, Instagram 
} from "lucide-react";
import type { TeamMember } from "@shared/schema";

export default function TeamMemberPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: member, isLoading, error } = useQuery<TeamMember>({
    queryKey: [`/api/team/${slug}`],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid md:grid-cols-3 gap-8">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !member) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Team Member Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The team member you're looking for doesn't exist.
          </p>
          <Link href="/about">
            <Button data-testid="button-back-to-team">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const socialLinks = [
    { url: member.linkedinUrl, icon: Linkedin, label: "LinkedIn" },
    { url: member.twitterUrl, icon: Twitter, label: "Twitter" },
    { url: member.facebookUrl, icon: Facebook, label: "Facebook" },
    { url: member.instagramUrl, icon: Instagram, label: "Instagram" },
  ].filter((link) => link.url);

  return (
    <Layout>
      <PageTransition>
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
          <AnimatedSection>
            <Link href="/about">
              <Button variant="ghost" className="mb-8" data-testid="button-back-to-about">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to About
              </Button>
            </Link>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-3 gap-0">
                  <div className="bg-muted p-8 flex items-center justify-center">
                    <Avatar className="w-48 h-48 md:w-64 md:h-64">
                      <AvatarImage src={member.imageUrl || undefined} alt={member.name} />
                      <AvatarFallback className="text-4xl">{initials}</AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="md:col-span-2 p-8">
                    <Badge variant="outline" className="mb-4">{member.role}</Badge>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2" data-testid="text-member-name">
                      {member.name}
                    </h1>
                    <p className="text-lg text-muted-foreground mb-6" data-testid="text-member-description">
                      {member.description}
                    </p>

                    {member.bio && (
                      <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                        <h3 className="text-lg font-semibold mb-2">About</h3>
                        <p className="text-muted-foreground whitespace-pre-line" data-testid="text-member-bio">
                          {member.bio}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                          data-testid="link-member-email"
                        >
                          <Mail className="w-4 h-4" />
                          {member.email}
                        </a>
                      )}
                      
                      {socialLinks.length > 0 && (
                        <div className="flex items-center gap-2 ml-auto">
                          {socialLinks.map((link) => (
                            <a
                              key={link.label}
                              href={link.url!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-full bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                              data-testid={`link-member-${link.label.toLowerCase()}`}
                            >
                              <link.icon className="w-5 h-5" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </PageTransition>
    </Layout>
  );
}
