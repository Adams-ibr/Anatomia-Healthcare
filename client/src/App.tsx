import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { StudentLayout } from "@/components/StudentLayout";
import { Preloader } from "@/components/Preloader";
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
import AdminCourses from "@/pages/admin/AdminCourses";
import AdminModules from "@/pages/admin/AdminModules";
import AdminLessons from "@/pages/admin/AdminLessons";
import AdminQuestionBank from "@/pages/admin/AdminQuestionBank";
import AdminFlashcards from "@/pages/admin/AdminFlashcards";
import AdminAnatomyModels from "@/pages/admin/AdminAnatomyModels";
import AdminMembers from "@/pages/admin/AdminMembers";
import Login from "@/pages/admin/Login";
import Register from "@/pages/auth/Register";
import UserLogin from "@/pages/auth/UserLogin";
import StudentDashboard from "@/pages/member/StudentDashboard";
import PracticeMode from "@/pages/member/PracticeMode";
import FlashcardStudy from "@/pages/member/FlashcardStudy";
import Anatomy3DViewer from "@/pages/member/Anatomy3DViewer";
import CoursePlayer from "@/pages/member/CoursePlayer";
import Subscribe from "@/pages/member/Subscribe";
import PaymentVerify from "@/pages/member/PaymentVerify";
import CourseCatalog from "@/pages/CourseCatalog";
import Pricing from "@/pages/Pricing";

function StudentRoutes() {
  return (
    <StudentLayout>
      <Switch>
        <Route path="/dashboard" component={StudentDashboard} />
        <Route path="/practice" component={PracticeMode} />
        <Route path="/flashcards" component={FlashcardStudy} />
        <Route path="/anatomy-viewer" component={Anatomy3DViewer} />
        <Route path="/courses" component={CourseCatalog} />
        <Route path="/subscribe" component={Subscribe} />
        <Route path="/payment/verify" component={PaymentVerify} />
        <Route path="/learn/:courseId" component={CoursePlayer} />
        <Route path="/learn/:courseId/:lessonId" component={CoursePlayer} />
      </Switch>
    </StudentLayout>
  );
}

function Router() {
  const [location] = useLocation();
  
  const isStudentRoute = 
    location === "/dashboard" ||
    location === "/practice" ||
    location === "/flashcards" ||
    location === "/anatomy-viewer" ||
    location === "/courses" ||
    location === "/subscribe" ||
    location === "/payment/verify" ||
    location.startsWith("/learn/");
  
  if (isStudentRoute) {
    return <StudentRoutes />;
  }
  
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
      <Route path="/admin/courses" component={AdminCourses} />
      <Route path="/admin/courses/:courseId/modules" component={AdminModules} />
      <Route path="/admin/modules/:moduleId/lessons" component={AdminLessons} />
      <Route path="/admin/question-bank" component={AdminQuestionBank} />
      <Route path="/admin/flashcards" component={AdminFlashcards} />
      <Route path="/admin/anatomy-models" component={AdminAnatomyModels} />
      <Route path="/admin/members" component={AdminMembers} />
      <Route path="/admin/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={UserLogin} />
      <Route path="/pricing" component={Pricing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Analytics() {
  const [location] = useLocation();
  
  useEffect(() => {
    // Track page view with Google Analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("config", import.meta.env.VITE_GA_MEASUREMENT_ID, {
        page_path: location,
      });
    }
  }, [location]);
  
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Preloader />
          <Toaster />
          <Analytics />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
