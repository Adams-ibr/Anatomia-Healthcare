import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowLeft, Trash2, Mail, MailOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ContactMessage } from "@shared/schema";

export default function AdminContacts() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: contacts, isLoading } = useQuery<ContactMessage[]>({
    queryKey: ["/api/admin/contacts"],
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/contacts/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contacts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contacts"] });
      toast({ title: "Message deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete message", variant: "destructive" }),
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const unreadCount = contacts?.filter(c => !c.isRead).length || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Contact Messages</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-muted-foreground">
            {contacts?.length || 0} messages ({unreadCount} unread)
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading messages...</div>
        ) : (
          <div className="space-y-4">
            {contacts?.map((contact) => (
              <Card 
                key={contact.id} 
                className={contact.isRead ? "opacity-70" : ""}
                data-testid={`contact-${contact.id}`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {contact.isRead ? (
                          <MailOpen className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Mail className="h-4 w-4 text-primary" />
                        )}
                        <h3 className="font-medium">{contact.name}</h3>
                        <Badge variant="secondary" className="text-xs">{contact.topic}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{contact.email}</p>
                      <p className="text-sm">{contact.message}</p>
                      {contact.createdAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(contact.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!contact.isRead && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => markReadMutation.mutate(contact.id)}
                          data-testid={`button-read-${contact.id}`}
                        >
                          Mark Read
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteMutation.mutate(contact.id)}
                        data-testid={`button-delete-${contact.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {contacts?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No contact messages yet.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
