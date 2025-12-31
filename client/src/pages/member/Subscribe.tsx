import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Check, Crown, Loader2, CreditCard, GraduationCap, Briefcase } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Member } from "@shared/schema";

type AudienceType = "student" | "professional";
type PeriodType = "monthly" | "quarterly" | "biannually" | "yearly";

interface PricingPlan {
  id: string;
  period: PeriodType;
  periodLabel: string;
  durationMonths: number;
  studentPrice: number;
  professionalPrice: number;
  discount?: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: "monthly",
    period: "monthly",
    periodLabel: "Monthly",
    durationMonths: 1,
    studentPrice: 10000,
    professionalPrice: 20000,
  },
  {
    id: "quarterly",
    period: "quarterly",
    periodLabel: "Quarterly",
    durationMonths: 3,
    studentPrice: 27000,
    professionalPrice: 54000,
    discount: "10% off",
  },
  {
    id: "biannually",
    period: "biannually",
    periodLabel: "Bi-annually",
    durationMonths: 6,
    studentPrice: 48000,
    professionalPrice: 96000,
    discount: "20% off",
  },
  {
    id: "yearly",
    period: "yearly",
    periodLabel: "Yearly",
    durationMonths: 12,
    studentPrice: 84000,
    professionalPrice: 168000,
    discount: "30% off",
  },
];

const features = {
  student: [
    "Full access to all courses",
    "3D anatomy viewer",
    "Question bank access",
    "Flashcard system",
    "Progress tracking",
    "PDF certificates",
  ],
  professional: [
    "Everything for Students",
    "Advanced anatomy models",
    "Cadaveric dissection videos",
    "CME/CPD credits",
    "1-on-1 mentorship sessions",
    "Priority support",
  ],
};

function formatPrice(kobo: number): string {
  return `N${(kobo / 100).toLocaleString()}`;
}

export default function Subscribe() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("monthly");
  const [selectedAudience, setSelectedAudience] = useState<AudienceType>("student");
  const [selectedProvider, setSelectedProvider] = useState<"paystack" | "flutterwave">("paystack");

  const { data: member } = useQuery<Member>({
    queryKey: ["/api/members/me"],
  });

  const initializePayment = useMutation({
    mutationFn: async ({ period, audience, provider }: { period: string; audience: string; provider: string }) => {
      const endpoint = provider === "paystack" 
        ? "/api/payments/initialize-paystack" 
        : "/api/payments/initialize-flutterwave";
      
      const response = await apiRequest("POST", endpoint, { period, audience });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast({
          title: "Error",
          description: "Failed to get payment link",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = () => {
    if (!member) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to subscribe",
        variant: "destructive",
      });
      return;
    }

    initializePayment.mutate({ period: selectedPeriod, audience: selectedAudience, provider: selectedProvider });
  };

  const selectedPlan = pricingPlans.find(p => p.period === selectedPeriod);
  const selectedPrice = selectedPlan ? (selectedAudience === "student" ? selectedPlan.studentPrice : selectedPlan.professionalPrice) : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-subscribe-title">
          Choose Your Plan
        </h1>
        <p className="text-muted-foreground">
          Select your category and billing period to get started
        </p>
        {member && member.membershipTier && member.membershipTier !== "bronze" && (
          <Badge variant="outline" className="mt-2">
            Current: {member.membershipTier?.charAt(0).toUpperCase() + (member.membershipTier?.slice(1) || "")}
          </Badge>
        )}
      </div>

      {/* Audience Selection */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-center">I am a...</h2>
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          <Card
            className={`cursor-pointer transition-all hover-elevate ${
              selectedAudience === "student" ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedAudience("student")}
            data-testid="card-select-student"
          >
            <CardContent className="flex flex-col items-center py-6 gap-3">
              <GraduationCap className="h-10 w-10 text-primary" />
              <div className="text-center">
                <CardTitle className="text-lg">Student</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Medical students, interns</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover-elevate ${
              selectedAudience === "professional" ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedAudience("professional")}
            data-testid="card-select-professional"
          >
            <CardContent className="flex flex-col items-center py-6 gap-3">
              <Briefcase className="h-10 w-10 text-primary" />
              <div className="text-center">
                <CardTitle className="text-lg">Professional</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Doctors, specialists</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Billing Period Selection */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-center">Billing Period</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pricingPlans.map((plan) => {
            const price = selectedAudience === "student" ? plan.studentPrice : plan.professionalPrice;
            return (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all hover-elevate ${
                  selectedPeriod === plan.period ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedPeriod(plan.period)}
                data-testid={`card-select-${plan.period}`}
              >
                {plan.discount && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs" variant="secondary">
                    {plan.discount}
                  </Badge>
                )}
                <CardContent className="py-4 text-center">
                  <CardTitle className="text-base mb-2">{plan.periodLabel}</CardTitle>
                  <div className="text-2xl font-bold text-primary">{formatPrice(price)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan.durationMonths} {plan.durationMonths === 1 ? "month" : "months"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Features */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            What's Included ({selectedAudience === "student" ? "Student" : "Professional"})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {features[selectedAudience].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedProvider}
            onValueChange={(value) => setSelectedProvider(value as "paystack" | "flutterwave")}
            className="grid grid-cols-2 gap-4"
          >
            <Label
              htmlFor="paystack"
              className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer transition-all ${
                selectedProvider === "paystack" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <RadioGroupItem value="paystack" id="paystack" />
              <div>
                <div className="font-medium">Paystack</div>
                <div className="text-xs text-muted-foreground">Cards, Bank Transfer, USSD</div>
              </div>
            </Label>
            <Label
              htmlFor="flutterwave"
              className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer transition-all ${
                selectedProvider === "flutterwave" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <RadioGroupItem value="flutterwave" id="flutterwave" />
              <div>
                <div className="font-medium">Flutterwave</div>
                <div className="text-xs text-muted-foreground">Cards, Bank, Mobile Money</div>
              </div>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center py-2 border-b gap-2">
            <span>{selectedAudience === "student" ? "Student" : "Professional"} Plan ({selectedPlan?.periodLabel})</span>
            <span className="font-semibold">{formatPrice(selectedPrice)}</span>
          </div>
          <div className="flex justify-between items-center py-2 font-bold text-lg gap-2">
            <span>Total</span>
            <span className="text-primary">{formatPrice(selectedPrice)}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubscribe}
            disabled={initializePayment.isPending}
            data-testid="button-pay-now"
          >
            {initializePayment.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ${formatPrice(selectedPrice)} with ${selectedProvider === "paystack" ? "Paystack" : "Flutterwave"}`
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
