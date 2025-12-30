import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const membershipTiers = [
  {
    name: "Bronze",
    price: "Free",
    period: "",
    description: "Perfect for getting started with medical education",
    color: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
    crownColor: "text-orange-500",
    features: [
      "Access to free courses",
      "Basic anatomy models",
      "Community forum access",
      "Limited quiz attempts",
      "Email support",
    ],
    notIncluded: [
      "Premium courses",
      "Advanced 3D models",
      "Flashcard system",
      "PDF certificates",
      "Priority support",
    ],
    buttonText: "Get Started Free",
    buttonVariant: "outline" as const,
    popular: false,
  },
  {
    name: "Silver",
    price: "N15,000",
    period: "/month",
    description: "Great for serious students expanding their knowledge",
    color: "bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600",
    crownColor: "text-gray-400",
    features: [
      "Everything in Bronze",
      "Access to Silver-tier courses",
      "Extended quiz attempts",
      "Basic flashcard system",
      "Progress tracking",
      "Standard support",
    ],
    notIncluded: [
      "Gold & Diamond courses",
      "Advanced 3D models",
      "PDF certificates",
      "Priority support",
    ],
    buttonText: "Subscribe to Silver",
    buttonVariant: "default" as const,
    buttonLink: "/subscribe",
    popular: false,
  },
  {
    name: "Gold",
    price: "N30,000",
    period: "/month",
    description: "Ideal for dedicated medical professionals",
    color: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700",
    crownColor: "text-yellow-500",
    features: [
      "Everything in Silver",
      "Access to Gold-tier courses",
      "Full 3D anatomy viewer",
      "Unlimited flashcards",
      "Practice mode access",
      "PDF certificates",
      "Priority email support",
    ],
    notIncluded: [
      "Diamond exclusive content",
      "1-on-1 mentorship",
    ],
    buttonText: "Subscribe to Gold",
    buttonVariant: "default" as const,
    buttonLink: "/subscribe",
    popular: true,
  },
  {
    name: "Diamond",
    price: "N50,000",
    period: "/month",
    description: "Complete access for elite medical education",
    color: "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700",
    crownColor: "text-purple-500",
    features: [
      "Everything in Gold",
      "All Diamond-exclusive courses",
      "Advanced 3D anatomy models",
      "Spaced repetition flashcards",
      "Unlimited practice tests",
      "Premium PDF certificates",
      "1-on-1 mentorship sessions",
      "24/7 priority support",
      "Early access to new content",
    ],
    notIncluded: [],
    buttonText: "Subscribe to Diamond",
    buttonVariant: "default" as const,
    buttonLink: "/subscribe",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <section className="relative py-16 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4" variant="secondary">Membership Plans</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-pricing-title">
                Choose Your Learning Path
              </h1>
              <p className="text-lg text-muted-foreground">
                Select the membership tier that fits your medical education goals. 
                Upgrade anytime as you progress in your learning journey.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {membershipTiers.map((tier) => (
                <Card 
                  key={tier.name} 
                  className={`relative flex flex-col ${tier.color} ${tier.popular ? 'ring-2 ring-primary' : ''}`}
                  data-testid={`card-tier-${tier.name.toLowerCase()}`}
                >
                  {tier.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-2">
                      <Crown className={`h-8 w-8 ${tier.crownColor}`} />
                    </div>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground">{tier.period}</span>
                    </div>
                    <CardDescription className="mt-2">
                      {tier.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  
                  <CardFooter className="pt-4">
                    <Button 
                      className="w-full" 
                      variant={tier.buttonVariant}
                      asChild
                      data-testid={`button-subscribe-${tier.name.toLowerCase()}`}
                    >
                      <Link href={tier.buttonLink || "/register"}>{tier.buttonText}</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
              
              <div className="space-y-4 text-left">
                <div className="bg-card rounded-lg p-4 border">
                  <h3 className="font-semibold mb-2">Can I upgrade my membership anytime?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes, you can upgrade your membership at any time. Your new benefits will be available immediately, and we'll prorate the difference.
                  </p>
                </div>
                
                <div className="bg-card rounded-lg p-4 border">
                  <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                  <p className="text-sm text-muted-foreground">
                    We accept bank transfers, card payments, and mobile money. Contact our support team for payment assistance.
                  </p>
                </div>
                
                <div className="bg-card rounded-lg p-4 border">
                  <h3 className="font-semibold mb-2">Is there a refund policy?</h3>
                  <p className="text-sm text-muted-foreground">
                    We offer a 7-day money-back guarantee for all paid memberships. If you're not satisfied, contact support for a full refund.
                  </p>
                </div>
                
                <div className="bg-card rounded-lg p-4 border">
                  <h3 className="font-semibold mb-2">Do memberships auto-renew?</h3>
                  <p className="text-sm text-muted-foreground">
                    Memberships are set to auto-renew by default, but you can cancel anytime from your dashboard settings before the renewal date.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center bg-primary/5 rounded-lg p-8 border border-primary/20">
              <h2 className="text-2xl font-bold mb-2">Ready to Start Learning?</h2>
              <p className="text-muted-foreground mb-6">
                Create your free account today and explore our medical education platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" data-testid="button-register-cta">
                  <Link href="/register">Create Free Account</Link>
                </Button>
                <Button asChild variant="outline" size="lg" data-testid="button-login-cta">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
