import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Mail, 
  Phone, 
  MapPin,
  ExternalLink,
  Info,
  Send,
  User,
  Loader2,
  CheckCircle
} from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    primary: "support@anatomia.com",
    secondary: "Response time: Within 24 hours"
  },
  {
    icon: Phone,
    title: "Phone",
    primary: "+1 (555) 123-ANAT",
    secondary: "Mon-Fri 9am-5pm EST"
  },
  {
    icon: MapPin,
    title: "Address",
    primary: "123 Medical Plaza, Science District",
    secondary: "New York, NY 10001"
  },
];

const topics = [
  "General Inquiry",
  "Technical Support",
  "Subscription & Billing",
  "Content Feedback",
  "Partnership Opportunities",
  "Press & Media",
];

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  topic: z.string().min(1, "Please select a topic"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const { toast } = useToast();
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      topic: "",
      message: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Thank you for contacting us. We'll get back to you soon!",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    mutation.mutate(data);
  };

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="text-contact-hero-title">
              Get in Touch
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Have a question about a specific muscle group? Need help with your account? We'd love to hear from you.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-6">Contact Information</h2>
              <div className="space-y-4 mb-8">
                {contactInfo.map((item) => (
                  <Card key={item.title}>
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{item.title}</h3>
                        <p className="text-sm text-primary">{item.primary}</p>
                        <p className="text-xs text-muted-foreground">{item.secondary}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-primary/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">New York Office Location</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 gap-2" data-testid="button-open-maps">
                Open in Maps <ExternalLink className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <Card>
                <CardContent className="p-6 md:p-8">
                  <h2 className="text-xl font-semibold text-foreground mb-6">Send us a Message</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Fill out the form below and our team will get back to you shortly.
                  </p>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input placeholder="John Doe" className="pl-9" data-testid="input-name" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input type="email" placeholder="john@example.com" className="pl-9" data-testid="input-email" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="topic"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Topic</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-topic">
                                  <SelectValue placeholder="Select a topic" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {topics.map((topic) => (
                                  <SelectItem key={topic} value={topic.toLowerCase().replace(/\s/g, '-')}>
                                    {topic}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>How can we help?</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Please describe your question or issue in detail..."
                                rows={5}
                                data-testid="input-message"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Info className="w-4 h-4" />
                          <span>Check our <Link href="/faq" className="text-primary hover:underline">FAQ</Link> for instant answers.</span>
                        </div>
                        <Button type="submit" className="gap-2" disabled={mutation.isPending} data-testid="button-send-message">
                          {mutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Sending...
                            </>
                          ) : mutation.isSuccess ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Sent!
                            </>
                          ) : (
                            <>
                              Send Message <Send className="w-4 h-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
