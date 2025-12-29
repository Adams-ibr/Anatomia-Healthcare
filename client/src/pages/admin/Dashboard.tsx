import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  HelpCircle, 
  Briefcase, 
  Mail, 
  Newspaper,
  LogOut
} from "lucide-react";

export default function Dashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useQuery<{
    contacts: number;
    subscribers: number;
    articles: number;
    products: number;
  }>({
    queryKey: ["/api/admin/stats"],
    enabled: !!user,
  });

  if (authLoading) {
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

  const menuItems = [
    { title: "Articles", icon: FileText, href: "/admin/articles", description: "Manage blog posts" },
    { title: "Team", icon: Users, href: "/admin/team", description: "Manage team members" },
    { title: "Products", icon: Package, href: "/admin/products", description: "Manage products/services" },
    { title: "FAQ", icon: HelpCircle, href: "/admin/faq", description: "Manage FAQ items" },
    { title: "Careers", icon: Briefcase, href: "/admin/careers", description: "Manage job listings" },
    { title: "Messages", icon: Mail, href: "/admin/contacts", description: "View contact messages" },
    { title: "Newsletter", icon: Newspaper, href: "/admin/newsletter", description: "View subscribers" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Anatomia Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.firstName || user.email}
            </span>
            <Button variant="outline" size="sm" onClick={() => logout()} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" data-testid="link-view-site">View Site</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-contacts">
                {statsLoading ? "..." : (stats?.contacts || 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-subscribers">
                {statsLoading ? "..." : (stats?.subscribers || 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-articles">
                {statsLoading ? "..." : (stats?.articles || 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-products">
                {statsLoading ? "..." : (stats?.products || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-lg font-semibold mb-4">Manage Content</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-${item.title.toLowerCase()}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <item.icon className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
