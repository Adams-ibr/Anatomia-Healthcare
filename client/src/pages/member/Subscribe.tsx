import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, LogIn, Crown } from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import type { Member } from "@shared/schema";

type PeriodType = "monthly" | "quarterly" | "biannually" | "yearly";

// Calculate standard durations according to dynamic plan mappings
const periods: { id: PeriodType, label: string, months: number, discountText?: string }[] = [
  { id: "monthly", label: "Monthly", months: 1 },
  { id: "quarterly", label: "Quarterly", months: 3 },
  { id: "biannually", label: "Bi-annually", months: 6, discountText: "Popular" },
  { id: "yearly", label: "Yearly", months: 12, discountText: "Best Value" },
];

function formatPrice(amount: number): string {
  if (amount === 0) return "Free";
  return `N${amount.toLocaleString()}`;
}

export default function Subscribe() {
  const { toast } = useToast();
  const searchParams = new URLSearchParams(useSearch());
  const tierParam = searchParams.get("tier") || "gold";

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("monthly");
  const [selectedProvider, setSelectedProvider] = useState<"paystack" | "flutterwave">("paystack");
  const [, setLocation] = useLocation();

  const { data: member, isLoading: memberLoading } = useQuery<Member | null>({
    queryKey: ["/api/members/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const isLoggedIn = !!member;

  // Calculate mock display price since actual transaction amount calculates securely on backend
  const basePriceMap: Record<string, { student: number, professional: number }> = {
    "silver": { student: 5000, professional: 10000 },
    "gold": { student: 8000, professional: 15000 },
    "diamond": { student: 10000, professional: 20000 },
  };

  const userType = member?.userType || "student";
  const baseMonthlyPrice = basePriceMap[tierParam.toLowerCase()]?.[userType as 'student' | 'professional'] || 8000;

  // Adjust display pricing to match 12 month discounts if needed
  const periodData = periods.find(p => p.id === selectedPeriod);
  const displayPrice = baseMonthlyPrice * (periodData?.months || 1);

  const initializePayment = useMutation({
    mutationFn: async ({ period, provider, tier }: { period: string; provider: string; tier: string }) => {
      const endpoint = provider === "paystack"
        ? "/api/payments/initialize-paystack"
        : "/api/payments/initialize-flutterwave";

      const response = await apiRequest("POST", endpoint, { period, tier });
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
    if (!isLoggedIn) {
      setLocation("/login");
      return;
    }
    initializePayment.mutate({ period: selectedPeriod, provider: selectedProvider, tier: tierParam });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl min-h-screen">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-3" data-testid="text-subscribe-title">
          Complete Your Subscription
        </h1>
        <p className="text-muted-foreground text-lg">
          You are subscribing to the <span className="font-semibold text-primary capitalize">{tierParam}</span> plan.
        </p>
        {member && member.membershipTier && member.membershipTier !== "bronze" && (
          <Badge variant="outline" className="mt-4">
            Current Tier: {member.membershipTier?.charAt(0).toUpperCase() + (member.membershipTier?.slice(1) || "")}
          </Badge>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">

          {/* Billing Period Selection */}
          <section>
            <h2 className="text-xl font-bold mb-4">Select Billing Cycle</h2>
            <div className="grid grid-cols-2 gap-4">
              {periods.map((plan) => {
                const cyclePrice = baseMonthlyPrice * plan.months;
                return (
                  <Card
                    key={plan.id}
                    className={`relative cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md ${selectedPeriod === plan.id ? "ring-2 ring-primary border-primary bg-primary/5" : ""
                      }`}
                    onClick={() => setSelectedPeriod(plan.id)}
                    data-testid={`card-select-${plan.id}`}
                  >
                    {plan.discountText && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 font-semibold shadow-sm">
                        {plan.discountText}
                      </Badge>
                    )}
                    <CardContent className="py-5 text-center flex flex-col items-center justify-center">
                      <div className="font-medium text-lg mb-1">{plan.label}</div>
                      <div className="text-2xl font-bold text-primary mb-1">{formatPrice(cyclePrice)}</div>
                      <p className="text-xs text-muted-foreground">
                        {plan.months > 1 ? `Billed every ${plan.months} months` : "Billed monthly"}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Payment Method */}
          <section className="mt-8">
            <h2 className="text-xl font-bold mb-4">Payment Method</h2>
            <RadioGroup
              value={selectedProvider}
              onValueChange={(value) => setSelectedProvider(value as "paystack" | "flutterwave")}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <Label
                htmlFor="paystack"
                className={`flex items-start gap-4 p-5 border rounded-xl cursor-pointer transition-all ${selectedProvider === "paystack" ? "border-primary bg-primary/5 ring-primary ring-1 shadow-sm" : "border-border hover:bg-muted/50"
                  }`}
              >
                <RadioGroupItem value="paystack" id="paystack" className="mt-1" />
                <div>
                  <div className="font-semibold text-base mb-1">Paystack</div>
                  <div className="text-sm text-muted-foreground">Cards, Bank Transfer, USSD</div>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Paystack_Logo.png/1200px-Paystack_Logo.png" alt="Paystack" className="h-4 mt-3 opacity-60 grayscale hover:grayscale-0 transition-opacity" />
                </div>
              </Label>
              <Label
                htmlFor="flutterwave"
                className={`flex items-start gap-4 p-5 border rounded-xl cursor-pointer transition-all ${selectedProvider === "flutterwave" ? "border-primary bg-primary/5 ring-primary ring-1 shadow-sm" : "border-border hover:bg-muted/50"
                  }`}
              >
                <RadioGroupItem value="flutterwave" id="flutterwave" className="mt-1" />
                <div>
                  <div className="font-semibold text-base mb-1">Flutterwave</div>
                  <div className="text-sm text-muted-foreground">Cards, Bank, Mobile Money</div>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Flutterwave_Logo.png/800px-Flutterwave_Logo.png" alt="Flutterwave" className="h-4 mt-3 opacity-60 grayscale hover:grayscale-0 transition-opacity" />
                </div>
              </Label>
            </RadioGroup>
          </section>
        </div>

        {/* Order Summary Sidebar */}
        <div className="md:col-span-1">
          <Card className="sticky top-24 shadow-sm border-primary/10">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 text-sm font-medium">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membership:</span>
                  <span className="capitalize">{tierParam}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Status:</span>
                  <span className="capitalize">{userType} Discount</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing Cycle:</span>
                  <span>{periodData?.label}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center text-xl">
                  <span className="font-bold">Total</span>
                  <span className="font-extrabold tracking-tight text-primary text-2xl">{formatPrice(displayPrice)}</span>
                </div>
                <p className="text-xs text-muted-foreground text-right mt-1">Due today</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 bg-muted/30 pt-4 rounded-b-xl border-t">
              {!isLoggedIn && !memberLoading && (
                <div className="w-full text-center">
                  <p className="text-sm font-medium mb-3">
                    You must be logged in to subscribe.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" asChild className="w-full shadow-sm">
                      <Link href="/login">Log In</Link>
                    </Button>
                    <Button asChild className="w-full shadow-sm">
                      <Link href="/register">Create Account</Link>
                    </Button>
                  </div>
                </div>
              )}
              {isLoggedIn && (
                <Button
                  className="w-full h-12 text-base font-semibold shadow-md active:scale-[0.98] transition-all"
                  onClick={handleSubscribe}
                  disabled={initializePayment.isPending || memberLoading}
                  data-testid="button-pay-now"
                >
                  {initializePayment.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Proceed to Payment
                    </>
                  )}
                </Button>
              )}

              <p className="text-xs text-muted-foreground text-center mt-2 px-2 flex items-center justify-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                SSL Secure Encrypted Checkout
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
