import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChevronUp,
  FileText,
  CheckCircle,
  AlertTriangle,
  User,
  Lock,
  CreditCard,
  Scale,
  Phone,
  Mail,
  MapPin,
  MessageSquare
} from "lucide-react";

const tableOfContents = [
  { number: "1", title: "Introduction" },
  { number: "2", title: "Acceptance" },
  { number: "3", title: "Medical Disclaimer" },
  { number: "4", title: "User Accounts" },
  { number: "5", title: "Intellectual Property" },
  { number: "6", title: "Subscriptions" },
  { number: "7", title: "Limitation of Liability" },
  { number: "8", title: "Contact Us" },
];

export default function Terms() {
  return (
    <Layout>
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-4 gap-8">
            <aside className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">Table of Contents</h3>
                  <nav className="space-y-1">
                    {tableOfContents.map((item) => (
                      <a
                        key={item.number}
                        href={`#section-${item.number}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-1"
                      >
                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary">
                          {item.number}
                        </span>
                        {item.title}
                      </a>
                    ))}
                  </nav>
                </CardContent>
              </Card>

              <Card className="bg-primary/5">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-foreground mb-2">Need help?</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Our support team is available to answer your questions.
                  </p>
                  <Link href="/contact">
                    <Button variant="outline" className="w-full gap-2" data-testid="button-contact-support">
                      <MessageSquare className="w-4 h-4" />
                      Contact Support
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </aside>

            <div className="lg:col-span-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <FileText className="w-4 h-4" />
                Last Updated: October 24, 2023
              </div>

              <h1 className="text-4xl font-bold text-foreground mb-8" data-testid="text-terms-title">
                Terms of Service
              </h1>

              <div className="prose prose-lg max-w-none dark:prose-invert space-y-12">
                <section id="section-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground m-0">1. Introduction</h2>
                  </div>
                  <p className="text-muted-foreground">
                    Welcome to Anatomia. These Terms of Service ("Terms") govern your access to and use of the Anatomia website, mobile applications, and educational content (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms and our Privacy Policy.
                  </p>
                  <p className="text-muted-foreground">
                    Anatomia provides high-quality anatomical illustrations, 3D models, and educational articles designed for students, medical professionals, and enthusiasts. Please read these terms carefully before starting your learning journey.
                  </p>
                </section>

                <section id="section-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground m-0">2. Acceptance of Terms</h2>
                  </div>
                  <p className="text-muted-foreground">
                    By creating an account, subscribing to our services, or simply browsing the website, you acknowledge that you have read, understood, and agree to be legally bound by these Terms. If you do not agree to any of these terms, you are prohibited from using or accessing this site.
                  </p>
                </section>

                <section id="section-3">
                  <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">3. Medical Disclaimer</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            <strong>Anatomia is an educational tool and reference guide only.</strong>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            The content provided in this Service, including text, graphics, images, and other material, is for informational and educational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Never disregard professional medical advice or delay in seeking it because of something you have read on Anatomia.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                <section id="section-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground m-0">4. User Accounts</h2>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    To access certain features of the Service, such as quizzes and advanced 3D models, you may be required to register for an account. You agree to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Provide accurate, current, and complete information during the registration process.</li>
                    <li>Maintain the security of your password and identification.</li>
                    <li>Maintain and promptly update the registration data, and any other information you provide to us.</li>
                    <li>Accept all risks of unauthorized access to the registration data and any other information you provide to us.</li>
                  </ul>
                </section>

                <section id="section-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground m-0">5. Intellectual Property</h2>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    The Service and its original content, features, and functionality are and will remain the exclusive property of Anatomia and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
                  </p>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium text-foreground mb-1">Permitted Use</h4>
                          <p className="text-muted-foreground">Personal, non-commercial educational use. Printing single copies of articles for study.</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground mb-1">Prohibited Use</h4>
                          <p className="text-muted-foreground">Republication on other websites. Use in commercial training materials without license.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                <section id="section-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground m-0">6. Subscriptions & Payments</h2>
                  </div>
                  <p className="text-muted-foreground">
                    Anatomia offers a "Pro" subscription that grants access to premium content. Subscriptions are billed on a monthly or annual basis. You may cancel your subscription at any time; however, there are no refunds for cancellations. In the event that Anatomia suspends or terminates your account or these Terms for your breach, of these Terms, you understand and agree that you shall receive no refund or exchange for any unused time on a subscription.
                  </p>
                </section>

                <section id="section-7">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Scale className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground m-0">7. Limitation of Liability</h2>
                  </div>
                  <p className="text-muted-foreground">
                    In no event shall Anatomia, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service; any conduct or content of any third party on the Service; any content obtained from the Service; and unauthorized access, use, or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence), or any other legal theory.
                  </p>
                </section>

                <section id="section-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground m-0">8. Contact Us</h2>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    If you have any questions about these Terms, please contact us.
                  </p>
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">Email Legal Team</p>
                            <p className="text-sm text-primary">legal@anatomia.com</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">Mail Address</p>
                            <p className="text-sm text-muted-foreground">123 Science Park, Cambridge, UK</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              </div>

              <div className="mt-12 text-center">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  data-testid="button-back-to-top"
                >
                  <ChevronUp className="w-4 h-4" />
                  Back to top
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
