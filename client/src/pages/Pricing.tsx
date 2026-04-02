import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Crown } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// Dynamic pricing structure based on the database seed
const membershipTiers = [
  {
    name: "Bronze",
    description: "Perfect for getting started with medical education",
    color: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
    crownColor: "text-orange-500",
    pricing: {
      student: "Free",
      professional: "Free",
      period: ""
    },
    features: [
      "Access to free courses",
      "Preview basic anatomy models",
      "Community forum access",
      "Limited quiz attempts",
    ],
    buttonText: "Get Started Free",
    buttonVariant: "outline" as const,
    buttonLink: "/register",
    popular: false,
  },
  {
    name: "Silver",
    description: "Great for serious learners expanding their knowledge",
    color: "bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600",
    crownColor: "text-gray-400",
    pricing: {
      student: "N5,000",
      professional: "N10,000",
      period: "/month"
    },
    features: [
      "Everything in Bronze",
      "Access to standard courses",
      "Unlimited basic quizzes",
      "Progress tracking",
      "Watermarked certificates",
    ],
    buttonText: "Subscribe",
    buttonVariant: "default" as const,
    buttonLink: "/subscribe?tier=silver",
    popular: false,
  },
  {
    name: "Gold",
    description: "Ideal for dedicated medical professionals",
    color: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700",
    crownColor: "text-yellow-500",
    pricing: {
      student: "N8,000",
      professional: "N15,000",
      period: "/month"
    },
    features: [
      "Everything in Silver",
      "Advanced 3D anatomy viewer",
      "Clinical case studies",
      "Downloadable certificates",
      "Advanced question banks",
      "Performance analytics",
    ],
    buttonText: "Subscribe",
    buttonVariant: "default" as const,
    buttonLink: "/subscribe?tier=gold",
    popular: true,
  },
  {
    name: "Diamond",
    description: "Complete access for elite medical education",
    color: "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700",
    crownColor: "text-purple-500",
    pricing: {
      student: "N10,000",
      professional: "N20,000",
      period: "/month"
    },
    features: [
      "Everything in Gold",
      "All 3D anatomy & simulations",
      "OSCE exam prep & mock exams",
      "AI quiz generator",
      "Premium certificates",
      "Offline access",
      "Priority 24/7 support",
    ],
    buttonText: "Subscribe",
    buttonVariant: "default" as const,
    buttonLink: "/subscribe?tier=diamond",
    popular: false,
  },
];

export default function Pricing() {
  const [userType, setUserType] = useState<"student" | "professional">("student");

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
              <p className="text-lg text-muted-foreground mb-8">
                Select the membership tier that fits your medical education goals.
                Upgrade anytime as you progress in your learning journey.
              </p>

              {/* User Type Toggle */}
              <div className="flex justify-center mb-12">
                <Tabs value={userType} onValueChange={(v) => setUserType(v as "student" | "professional")}>
                  <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="student" className="text-sm">Student</TabsTrigger>
                    <TabsTrigger value="professional" className="text-sm">Professional</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {membershipTiers.map((tier) => (
                <Card
                  key={tier.name}
                  className={`relative flex flex-col ${tier.color} ${tier.popular ? 'ring-2 ring-primary shadow-lg scale-105' : ''}`}
                  data-testid={`card-tier-${tier.name.toLowerCase()}`}
                >
                  {tier.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-sm font-semibold">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-2">
                      <Crown className={`h-8 w-8 ${tier.crownColor}`} />
                    </div>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <div className="mt-4 mb-2">
                      <span className="text-4xl font-extrabold tracking-tight">
                        {tier.pricing[userType]}
                      </span>
                      <span className="text-muted-foreground ml-1">{tier.pricing.period}</span>
                    </div>
                    <CardDescription className="mt-2 text-sm leading-relaxed">
                      {tier.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 mt-4 border-t border-black/5 dark:border-white/5 pt-6">
                    <ul className="space-y-4 text-sm">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary shrink-0" />
                          <span className="text-muted-foreground/90 font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-6">
                    <Button
                      className="w-full font-semibold shadow-sm"
                      variant={tier.buttonVariant}
                      asChild
                      data-testid={`button-subscribe-${tier.name.toLowerCase()}`}
                    >
                      <Link href={tier.buttonLink}>{tier.buttonText}</Link>
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
              <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>

              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div className="bg-card rounded-xl p-6 shadow-sm border">
                  <h3 className="font-semibold mb-2">Can I upgrade my membership anytime?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Yes, you can upgrade your membership at any time. Your new benefits will be available immediately, and we'll apply any necessary prorations.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 shadow-sm border">
                  <h3 className="font-semibold mb-2">How do you verify student status?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Student pricing is applied automatically based on your initial profile selection. Future verifications may require upload of a valid medical student ID.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 shadow-sm border">
                  <h3 className="font-semibold mb-2">Do memberships auto-renew?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Memberships auto-renew by default. You can easily manage your billing or cancel your subscription anytime via your member dashboard.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 shadow-sm border">
                  <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We accept standard bank transfers, card payments (Visa, Mastercard, Verve), and mobile money via Paystack and Flutterwave.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
