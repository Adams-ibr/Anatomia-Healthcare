import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  ArrowLeft,
  Download,
  Info,
  Database,
  RefreshCw,
  Cookie,
  Shield,
  Scale,
  Mail,
  Phone
} from "lucide-react";

const sections = [
  { icon: Info, label: "Introduction" },
  { icon: Database, label: "Data Collection" },
  { icon: RefreshCw, label: "How We Use Data" },
  { icon: Cookie, label: "Cookies & Tracking" },
  { icon: Shield, label: "Data Protection" },
  { icon: Scale, label: "User Rights" },
];

const policyItems = [
  {
    icon: Database,
    number: "1",
    title: "Data Collection",
    content: "We collect information you provide directly, such as when you create an account, subscribe to our newsletter, or contact support. This includes your name, email address, and any other information you choose to provide. We also automatically collect certain information when you use our Service, including your IP address, browser type, operating system, and usage patterns."
  },
  {
    icon: RefreshCw,
    number: "2",
    title: "How We Use Your Data",
    content: "We use the information we collect to provide, maintain, and improve our Service; to process transactions and send related information; to send promotional communications (with your consent); to respond to your comments and questions; and to detect, prevent, and address technical issues or fraud."
  },
  {
    icon: Cookie,
    number: "3",
    title: "Cookies & Tracking",
    content: "We use cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent."
  },
  {
    icon: Shield,
    number: "4",
    title: "Data Protection Measures",
    content: "We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. This includes encryption of data in transit and at rest, regular security assessments, and employee training on data protection."
  },
  {
    icon: Scale,
    number: "5",
    title: "Your Rights (GDPR/CCPA)",
    content: "Depending on your location, you may have the right to access, correct, or delete your personal data; object to or restrict processing; data portability; and the right to withdraw consent. EU residents have additional rights under GDPR, and California residents have rights under CCPA."
  },
];

export default function Privacy() {
  return (
    <Layout>
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-4 gap-8">
            <aside className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">Contents</h3>
                  <nav className="space-y-1">
                    {sections.map((section, index) => (
                      <Button
                        key={section.label}
                        variant={index === 0 ? "default" : "ghost"}
                        className="w-full justify-start gap-2"
                        size="sm"
                        data-testid={`button-section-${section.label.toLowerCase().replace(/\s/g, '-')}`}
                      >
                        <section.icon className="w-4 h-4" />
                        {section.label}
                      </Button>
                    ))}
                  </nav>
                </CardContent>
              </Card>

              <Card className="bg-primary/5">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-foreground mb-2">Download Policy</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Save a copy of our privacy policy for your records.
                  </p>
                  <Button variant="outline" className="w-full gap-2" data-testid="button-download-pdf">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
            </aside>

            <div className="lg:col-span-3">
              <Link href="/sitemap">
                <Button variant="ghost" className="gap-2 mb-6 text-primary" data-testid="link-back-legal">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Legal Center
                </Button>
              </Link>

              <h1 className="text-4xl font-bold text-foreground mb-2" data-testid="text-privacy-title">
                Privacy Policy
              </h1>
              <p className="text-muted-foreground mb-8">
                Effective Date: October 24, 2023 · Version 2.4
              </p>

              <div className="prose prose-lg max-w-none dark:prose-invert mb-12">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Introduction</h2>
                <p className="text-muted-foreground mb-4">
                  At <strong className="text-foreground">Anatomia</strong>, we are committed to maintaining the trust and confidence of our visitors to our web site. In this Privacy Policy, we've provided detailed information on when and why we collect your personal information, how we use it, the limited conditions under which we may disclose it to others and how we keep it secure.
                </p>
                <p className="text-muted-foreground">
                  By accessing or using our Service, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy and our Terms of Service.
                </p>
              </div>

              <Accordion type="single" collapsible className="space-y-4">
                {policyItems.map((item) => (
                  <AccordionItem 
                    key={item.number} 
                    value={`item-${item.number}`}
                    className="border rounded-lg px-6"
                  >
                    <AccordionTrigger className="text-left" data-testid={`accordion-policy-${item.number}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <item.icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{item.number}. {item.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pl-11">
                      {item.content}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <Card className="mt-12 bg-card">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Have questions about your data?</h3>
                      <p className="text-sm text-muted-foreground">
                        Our Data Protection Officer is here to help with any concerns.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Link href="/contact">
                        <Button variant="outline" className="gap-2" data-testid="button-contact-support">
                          <Phone className="w-4 h-4" />
                          Contact Support
                        </Button>
                      </Link>
                      <Button className="gap-2" data-testid="button-email-privacy">
                        <Mail className="w-4 h-4" />
                        Email Privacy Team
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
