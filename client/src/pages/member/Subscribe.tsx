import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, Crown, Loader2, CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Member } from "@shared/schema";

const membershipTiers = [
  {
    id: "silver",
    name: "Silver",
    price: 15000,
    priceDisplay: "N15,000",
    period: "/month",
    description: "Great for serious students",
    color: "bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600",
    crownColor: "text-gray-400",
    features: [
      "Access to Silver-tier courses",
      "Extended quiz attempts",
      "Basic flashcard system",
      "Progress tracking",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    price: 30000,
    priceDisplay: "N30,000",
    period: "/month",
    description: "Ideal for dedicated professionals",
    color: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700",
    crownColor: "text-yellow-500",
    features: [
      "Everything in Silver",
      "Access to Gold-tier courses",
      "Full 3D anatomy viewer",
      "Unlimited flashcards",
      "PDF certificates",
    ],
    popular: true,
  },
  {
    id: "diamond",
    name: "Diamond",
    price: 50000,
    priceDisplay: "N50,000",
    period: "/month",
    description: "Complete elite access",
    color: "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700",
    crownColor: "text-purple-500",
    features: [
      "Everything in Gold",
      "All Diamond-exclusive courses",
      "Advanced 3D anatomy models",
      "1-on-1 mentorship sessions",
      "24/7 priority support",
    ],
  },
];

export default function Subscribe() {
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState("gold");
  const [selectedProvider, setSelectedProvider] = useState<"paystack" | "flutterwave">("paystack");

  const { data: member } = useQuery<Member>({
    queryKey: ["/api/members/me"],
  });

  const initializePayment = useMutation({
    mutationFn: async ({ tier, provider }: { tier: string; provider: string }) => {
      const endpoint = provider === "paystack" 
        ? "/api/payments/initialize-paystack" 
        : "/api/payments/initialize-flutterwave";
      
      const response = await apiRequest("POST", endpoint, { tier });
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

    initializePayment.mutate({ tier: selectedTier, provider: selectedProvider });
  };

  const selectedPlan = membershipTiers.find(t => t.id === selectedTier);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-subscribe-title">
          Upgrade Your Membership
        </h1>
        <p className="text-muted-foreground">
          Choose a plan and payment method to unlock premium features
        </p>
        {member && (
          <Badge variant="outline" className="mt-2">
            Current tier: {member.membershipTier?.charAt(0).toUpperCase() + (member.membershipTier?.slice(1) || "")}
          </Badge>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {membershipTiers.map((tier) => (
          <Card
            key={tier.id}
            className={`relative cursor-pointer transition-all ${tier.color} ${
              selectedTier === tier.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedTier(tier.id)}
            data-testid={`card-select-${tier.id}`}
          >
            {tier.popular && (
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs">
                Popular
              </Badge>
            )}
            <CardHeader className="text-center pb-2">
              <Crown className={`h-6 w-6 mx-auto ${tier.crownColor}`} />
              <CardTitle className="text-lg">{tier.name}</CardTitle>
              <div>
                <span className="text-2xl font-bold">{tier.priceDisplay}</span>
                <span className="text-muted-foreground text-sm">{tier.period}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1 text-sm">
                {tier.features.slice(0, 3).map((feature) => (
                  <li key={feature} className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-green-500 shrink-0" />
                    <span className="text-xs">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Select Payment Method
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
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
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
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center py-2 border-b">
            <span>{selectedPlan?.name} Membership (1 month)</span>
            <span className="font-semibold">{selectedPlan?.priceDisplay}</span>
          </div>
          <div className="flex justify-between items-center py-2 font-bold text-lg">
            <span>Total</span>
            <span>{selectedPlan?.priceDisplay}</span>
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
              `Pay ${selectedPlan?.priceDisplay} with ${selectedProvider === "paystack" ? "Paystack" : "Flutterwave"}`
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
