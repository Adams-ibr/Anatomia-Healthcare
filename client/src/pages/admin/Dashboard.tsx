import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  FileText, 
  Users, 
  Package, 
  HelpCircle, 
  Briefcase, 
  Mail, 
  Newspaper,
  GraduationCap
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    contacts: number;
    subscribers: number;
    articles: number;
    products: number;
  }>({
    queryKey: ["/api/admin/stats"],
  });

  const menuItems = [
    { title: "LMS Courses", icon: GraduationCap, href: "/admin/courses", description: "Manage courses & lessons" },
    { title: "Articles", icon: FileText, href: "/admin/articles", description: "Manage blog posts" },
    { title: "Team", icon: Users, href: "/admin/team", description: "Manage team members" },
    { title: "Products", icon: Package, href: "/admin/products", description: "Manage products/services" },
    { title: "FAQ", icon: HelpCircle, href: "/admin/faq", description: "Manage FAQ items" },
    { title: "Careers", icon: Briefcase, href: "/admin/careers", description: "Manage job listings" },
    { title: "Messages", icon: Mail, href: "/admin/contacts", description: "View contact messages" },
    { title: "Newsletter", icon: Newspaper, href: "/admin/newsletter", description: "View subscribers" },
  ];

  return (
    <AdminLayout title="Dashboard">
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

      <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
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
    </AdminLayout>
  );
}
