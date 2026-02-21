import { useEffect, createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/StudentSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatWidget } from "@/components/ChatWidget";
import { getQueryFn } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import type { Member, MembershipTier } from "@shared/schema";

interface StudentLayoutProps {
  children: React.ReactNode;
}

interface MemberContextType {
  member: Member;
  isSubscriptionActive: boolean;
  hasMinimumTier: (requiredTier: MembershipTier) => boolean;
}

const MemberContext = createContext<MemberContextType | null>(null);

export function useMember() {
  const context = useContext(MemberContext);
  if (!context) {
    throw new Error("useMember must be used within StudentLayout");
  }
  return context;
}

const tierOrder: Record<MembershipTier, number> = {
  bronze: 0,
  silver: 1,
  gold: 2,
  diamond: 3,
};

function checkSubscriptionActive(member: Member): boolean {
  if (!member.membershipTier || member.membershipTier === "bronze") {
    return false;
  }
  if (member.membershipExpiresAt) {
    return new Date(member.membershipExpiresAt) > new Date();
  }
  return true;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const [, setLocation] = useLocation();

  const { data: member, isLoading, isFetched } = useQuery<Member | null>({
    queryKey: ["/api/members/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 0,
    retry: false,
  });

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  useEffect(() => {
    if (!isLoading && isFetched && !member) {
      setLocation("/login");
    }
  }, [member, isLoading, isFetched, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isActive = checkSubscriptionActive(member);

  const hasMinimumTier = (requiredTier: MembershipTier): boolean => {
    const memberTier = (member.membershipTier || "bronze") as MembershipTier;
    if (!isActive && memberTier !== "bronze") {
      return tierOrder["bronze"] >= tierOrder[requiredTier];
    }
    return tierOrder[memberTier] >= tierOrder[requiredTier];
  };

  const contextValue: MemberContextType = {
    member,
    isSubscriptionActive: isActive,
    hasMinimumTier,
  };

  return (
    <MemberContext.Provider value={contextValue}>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <StudentSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center justify-between gap-2 p-3 border-b bg-background sticky top-0 z-50">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
      <ChatWidget currentMemberId={member.id} />
    </MemberContext.Provider>
  );
}
