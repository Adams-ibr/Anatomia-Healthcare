import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/PageTransition";
import { AnimatedSection } from "@/components/AnimatedSection";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { useInViewAnimation } from "@/hooks/use-in-view-animation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Search,
  Info,
  CreditCard,
  Box,
  Award,
  Settings,
  Mail,
  MessageSquare,
  Smartphone
} from "lucide-react";

const categories = [
  { icon: Info, label: "General Info", active: true },
  { icon: CreditCard, label: "Subscription & Billing" },
  { icon: Box, label: "Anatomy 3D Tools" },
  { icon: Award, label: "Quizzes & Certificates" },
  { icon: Settings, label: "Technical Support" },
];

const faqs = [
  {
    question: "How do I access the 3D models?",
    answer: "You can access our 3D models through the 3D Atlas section. Free users have access to a limited selection, while Pro subscribers can explore our full library of over 2,500 interactive models. Simply navigate to the 3D Atlas, select a body region, and click on any structure to view it in 3D."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, absolutely! You can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period. There are no cancellation fees or hidden charges."
  },
  {
    question: "Is there a student discount available?",
    answer: "Yes! We offer a 50% discount for verified students. Simply sign up with your .edu email address or upload proof of enrollment. The discount applies to both monthly and annual subscriptions."
  },
  {
    question: "Can I use the images in my presentation?",
    answer: "Personal and educational use of our images is allowed with proper attribution. For commercial use or publication, please contact our licensing team at licensing@anatomia.com for specific permissions and pricing."
  },
  {
    question: "I forgot my password, how do I reset it?",
    answer: "Click the 'Forgot Password' link on the login page. Enter your email address, and we'll send you a secure reset link within minutes. If you don't receive the email, check your spam folder or contact support."
  },
];

export default function FAQ() {
  const prefersReducedMotion = useReducedMotion();
  const faqRef = useInViewAnimation({ threshold: 0.1 });

  return (
    <Layout>
      <PageTransition>
        <section className="py-8 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <Link href="/faq" className="hover:text-primary transition-colors">Help Center</Link>
              <span>/</span>
              <span className="text-foreground">FAQ</span>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-4 gap-8">
              <AnimatedSection>
                <aside className="space-y-6">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-4">Categories</h3>
                      <p className="text-sm text-muted-foreground mb-4">Filter by topic</p>
                      <nav className="space-y-1">
                        {categories.map((cat) => (
                          <Button
                            key={cat.label}
                            variant={cat.active ? "default" : "ghost"}
                            className="w-full justify-start gap-2"
                            size="sm"
                            data-testid={`button-category-${cat.label.toLowerCase().replace(/\s/g, '-')}`}
                          >
                            <cat.icon className="w-4 h-4" />
                            {cat.label}
                          </Button>
                        ))}
                      </nav>
                    </CardContent>
                  </Card>

                  <Card className="bg-primary text-primary-foreground">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Download the App
                      </h3>
                      <p className="text-sm text-primary-foreground/80 mb-4">
                        Study anatomy on the go with offline access.
                      </p>
                      <Button variant="secondary" size="sm" className="w-full" data-testid="button-get-app">
                        Get App
                      </Button>
                    </CardContent>
                  </Card>
                </aside>
              </AnimatedSection>

              <motion.div 
                className="lg:col-span-3"
                ref={faqRef.ref}
                initial={prefersReducedMotion ? false : "hidden"}
                animate={faqRef.isInView ? "visible" : "hidden"}
                variants={staggerContainer}
              >
                <motion.h1 
                  variants={fadeInUp}
                  className="text-3xl md:text-4xl font-bold text-foreground mb-4" 
                  data-testid="text-faq-title"
                >
                  Frequently Asked Questions
                </motion.h1>
                <motion.p variants={fadeInUp} className="text-muted-foreground mb-8">
                  Find quick answers to your questions about our content, subscriptions, and tools so you can get back to studying.
                </motion.p>

                <motion.div variants={fadeInUp} className="relative mb-8">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder="Search for answers (e.g. 'refund', '3d model')" 
                    className="pl-12 h-12"
                    data-testid="input-search-faq"
                  />
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <Accordion type="single" collapsible className="space-y-4">
                    {faqs.map((faq, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`item-${index}`}
                        className="border rounded-lg px-6"
                      >
                        <AccordionTrigger className="text-left font-medium" data-testid={`accordion-faq-${index}`}>
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <Card className="mt-12 bg-card">
                    <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">Still have questions?</h3>
                          <p className="text-sm text-muted-foreground">
                            Can't find the answer you're looking for? Our medical support team is here to help.
                          </p>
                        </div>
                      </div>
                      <Link href="/contact">
                        <Button className="gap-2 shrink-0" data-testid="button-contact-support">
                          <Mail className="w-4 h-4" />
                          Contact Support
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
}
