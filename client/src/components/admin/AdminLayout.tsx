import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  HelpCircle, 
  Briefcase, 
  Mail, 
  Newspaper,
  LogOut,
  ExternalLink,
  GraduationCap,
  Brain,
  Layers,
  Atom,
  Crown,
  Heart,
  Building2
} from "lucide-react";
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
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/admin", group: "Management" },
  { title: "Members", icon: Crown, href: "/admin/members", group: "Management" },
  { title: "LMS Courses", icon: GraduationCap, href: "/admin/courses", group: "LMS" },
  { title: "Question Bank", icon: Brain, href: "/admin/question-bank", group: "LMS" },
  { title: "Flashcards", icon: Layers, href: "/admin/flashcards", group: "LMS" },
  { title: "3D Models", icon: Atom, href: "/admin/anatomy-models", group: "LMS" },
  { title: "Articles", icon: FileText, href: "/admin/articles", group: "Content" },
  { title: "Team", icon: Users, href: "/admin/team", group: "Content" },
  { title: "Products", icon: Package, href: "/admin/products", group: "Content" },
  { title: "FAQ", icon: HelpCircle, href: "/admin/faq", group: "Content" },
  { title: "Careers", icon: Briefcase, href: "/admin/careers", group: "Content" },
  { title: "Departments", icon: Building2, href: "/admin/departments", group: "Content" },
  { title: "Messages", icon: Mail, href: "/admin/contacts", group: "Management" },
  { title: "Newsletter", icon: Newspaper, href: "/admin/newsletter", group: "Management" },
];

function AdminSidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  const groups = ["Management", "LMS", "Content"];
  const itemsByGroup = groups.map(group => ({
    group,
    items: menuItems.filter(item => item.group === group)
  }));

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary fill-primary" />
          <span className="font-semibold text-lg">Anatomia Admin</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {itemsByGroup.map(({ group, items }) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const isActive = location === item.href || 
                    (item.href !== "/admin" && location.startsWith(item.href));
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/" data-testid="link-view-site">
                <ExternalLink className="h-4 w-4" />
                <span>View Site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => logout()} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle>Admin Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">Please log in to access the admin dashboard.</p>
            <Button asChild>
              <Link href="/admin/login" data-testid="button-login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center gap-4 p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            {title && <h1 className="text-lg font-semibold">{title}</h1>}
            <div className="ml-auto flex items-center gap-3">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground">
                {user.firstName || user.email}
              </span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
