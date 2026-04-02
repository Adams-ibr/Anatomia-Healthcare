import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWaitlistSchema, type InsertWaitlist } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, CheckCircle2 } from "lucide-react";

export function WaitlistForm() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<InsertWaitlist>({
    resolver: zodResolver(insertWaitlistSchema),
    defaultValues: {
      name: "",
      email: "",
      interest: "3d_beta",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertWaitlist) => {
      return apiRequest("POST", "/api/waitlist", data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Success!",
        description: "You've been added to our 3D beta waitlist.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join waitlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-primary/5 rounded-2xl border border-primary/20 text-center animate-in fade-in zoom-in duration-300 w-full max-w-md mx-auto">
        <CheckCircle2 className="h-12 w-12 text-primary mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">You're on the list!</h3>
        <p className="text-slate-400">
          Thank you for your interest. We'll notify you as soon as the 3D beta is ready.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
        className="space-y-4 w-full max-w-md mx-auto"
      >
        <div className="grid grid-cols-1 gap-4 text-left">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    placeholder="Full Name" 
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary" 
                    {...field} 
                  />
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
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="Email Address" 
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          type="submit"
          className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-white transition-all shadow-lg shadow-primary/20 rounded-xl"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              JOINING...
            </>
          ) : (
            "JOIN OUR WAITLIST!"
          )}
        </Button>
      </form>
    </Form>
  );
}
