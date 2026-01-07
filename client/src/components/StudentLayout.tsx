import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/StudentSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getQueryFn } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import type { Member } from "@shared/schema";

interface StudentLayoutProps {
  children: React.ReactNode;
}

function isSubscriptionActive(member: Member): boolean {
  if (!member.membershipTier || member.membershipTier === "bronze") {
    return false;
  }
  if (member.membershipExpiresAt) {
    return new Date(member.membershipExpiresAt) > new Date();
  }
  return true;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const [location, setLocation] = useLocation();
  
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

  const publicStudentRoutePrefixes = ["/subscribe", "/payment/verify"];
  const basePath = location.split("?")[0];
  const isPublicRoute = publicStudentRoutePrefixes.some(prefix => basePath === prefix || basePath.startsWith(prefix + "/"));

  useEffect(() => {
    if (!isLoading && isFetched) {
      if (!member) {
        setLocation("/login");
        return;
      }
      
      if (!isPublicRoute && !isSubscriptionActive(member)) {
        setLocation("/subscribe");
      }
    }
  }, [member, isLoading, isFetched, location, setLocation, isPublicRoute]);

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

  return (
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
  );
}
