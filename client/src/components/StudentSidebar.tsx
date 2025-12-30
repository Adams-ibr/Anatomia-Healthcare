import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  BookOpen, 
  Brain, 
  Layers3, 
  Atom,
  LogOut,
  User,
  GraduationCap
} from "lucide-react";
import type { Member } from "@shared/schema";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Courses",
    url: "/courses",
    icon: BookOpen,
  },
  {
    title: "Practice Mode",
    url: "/practice",
    icon: Brain,
  },
  {
    title: "Flashcards",
    url: "/flashcards",
    icon: Layers3,
  },
  {
    title: "3D Anatomy",
    url: "/anatomy-viewer",
    icon: Atom,
  },
];

export function StudentSidebar() {
  const [location] = useLocation();
  
  const { data: member } = useQuery<Member>({
    queryKey: ["/api/members/me"],
  });

  const handleLogout = async () => {
    await fetch("/api/members/logout", { 
      method: "POST",
      credentials: "include" 
    });
    window.location.href = "/login";
  };

  const getInitials = (member: Member | undefined) => {
    if (!member) return "U";
    const first = member.firstName?.charAt(0) || "";
    const last = member.lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || member.email.charAt(0).toUpperCase();
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Anatomia</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Learning</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    data-testid={`sidebar-link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{getInitials(member)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {member?.firstName && member?.lastName 
                ? `${member.firstName} ${member.lastName}`
                : member?.email || "Student"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {member?.email}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start" 
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
