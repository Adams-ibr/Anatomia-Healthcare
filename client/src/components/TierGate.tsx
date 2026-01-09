import { Link } from "wouter";
import { useMember } from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown } from "lucide-react";
import type { MembershipTier } from "@shared/schema";

interface TierGateProps {
  requiredTier: MembershipTier;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const tierDisplayNames: Record<MembershipTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  diamond: "Diamond",
};

export function TierGate({ requiredTier, children, fallback }: TierGateProps) {
  const { hasMinimumTier, isSubscriptionActive, member } = useMember();
  
  const hasAccess = hasMinimumTier(requiredTier);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  const currentTier = member.membershipTier || "bronze";
  const needsUpgrade = !isSubscriptionActive || currentTier === "bronze";
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          {tierDisplayNames[requiredTier]} Tier Required
        </CardTitle>
        <CardDescription>
          {needsUpgrade
            ? "Upgrade your subscription to access this content"
            : `This content requires ${tierDisplayNames[requiredTier]} tier or higher`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button asChild data-testid="button-upgrade-tier">
          <Link href="/subscribe">Upgrade Now</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function PremiumBadge({ tier }: { tier: MembershipTier }) {
  const colorMap: Record<MembershipTier, string> = {
    bronze: "bg-amber-700 text-white",
    silver: "bg-slate-400 text-white",
    gold: "bg-amber-400 text-black",
    diamond: "bg-cyan-400 text-black",
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colorMap[tier]}`}>
      <Crown className="h-3 w-3" />
      {tierDisplayNames[tier]}
    </span>
  );
}
