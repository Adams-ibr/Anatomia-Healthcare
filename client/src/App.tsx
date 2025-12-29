import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Blog from "@/pages/Blog";
import SingleBlog from "@/pages/SingleBlog";
import Career from "@/pages/Career";
import Contact from "@/pages/Contact";
import FAQ from "@/pages/FAQ";
import Services from "@/pages/Services";
import Search from "@/pages/Search";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Sitemap from "@/pages/Sitemap";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/admin/Dashboard";
import AdminArticles from "@/pages/admin/AdminArticles";
import AdminTeam from "@/pages/admin/AdminTeam";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminFaq from "@/pages/admin/AdminFaq";
import AdminCareers from "@/pages/admin/AdminCareers";
import AdminContacts from "@/pages/admin/AdminContacts";
import AdminNewsletter from "@/pages/admin/AdminNewsletter";
import Login from "@/pages/admin/Login";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={SingleBlog} />
      <Route path="/careers" component={Career} />
      <Route path="/contact" component={Contact} />
      <Route path="/faq" component={FAQ} />
      <Route path="/services" component={Services} />
      <Route path="/search" component={Search} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/sitemap" component={Sitemap} />
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/articles" component={AdminArticles} />
      <Route path="/admin/team" component={AdminTeam} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/faq" component={AdminFaq} />
      <Route path="/admin/careers" component={AdminCareers} />
      <Route path="/admin/contacts" component={AdminContacts} />
      <Route path="/admin/newsletter" component={AdminNewsletter} />
      <Route path="/admin/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
