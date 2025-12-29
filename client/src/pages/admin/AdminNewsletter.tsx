import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { NewsletterSubscription } from "@shared/schema";

export default function AdminNewsletter() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: subscriptions, isLoading } = useQuery<NewsletterSubscription[]>({
    queryKey: ["/api/admin/newsletter"],
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/newsletter/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletter"] });
      toast({ title: "Subscription removed successfully" });
    },
    onError: () => toast({ title: "Failed to remove subscription", variant: "destructive" }),
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Newsletter Subscribers</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-muted-foreground">{subscriptions?.length || 0} subscribers</p>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading subscribers...</div>
        ) : (
          <div className="space-y-2">
            {subscriptions?.map((sub) => (
              <Card key={sub.id} data-testid={`subscription-${sub.id}`}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{sub.email}</p>
                      {sub.createdAt && (
                        <p className="text-xs text-muted-foreground">
                          Subscribed: {new Date(sub.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteMutation.mutate(sub.id)}
                      data-testid={`button-delete-${sub.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {subscriptions?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No subscribers yet.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
