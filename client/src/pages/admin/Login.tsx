import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { user, isLoading, loginAsync, registerAsync, isLoggingIn, isRegistering, loginError, registerError } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");

  useEffect(() => {
    if (user) {
      setLocation("/admin");
    }
  }, [user, setLocation]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await loginAsync({ email, password });
      toast({ title: "Login successful" });
      setLocation("/admin");
    } catch (error) {
      toast({ 
        title: "Login failed", 
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive" 
      });
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;

    try {
      await registerAsync({ email, password, firstName, lastName });
      toast({ title: "Registration successful" });
      setLocation("/admin");
    } catch (error) {
      toast({ 
        title: "Registration failed", 
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive" 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Anatomia Admin</CardTitle>
          <CardDescription>Manage your medical education platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input 
                    id="login-email" 
                    name="email" 
                    type="email" 
                    required 
                    placeholder="admin@example.com"
                    data-testid="input-login-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input 
                    id="login-password" 
                    name="password" 
                    type="password" 
                    required 
                    minLength={6}
                    placeholder="Enter your password"
                    data-testid="input-login-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoggingIn}
                  data-testid="button-login"
                >
                  {isLoggingIn ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-firstName">First Name</Label>
                    <Input 
                      id="register-firstName" 
                      name="firstName" 
                      placeholder="John"
                      data-testid="input-register-firstName"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-lastName">Last Name</Label>
                    <Input 
                      id="register-lastName" 
                      name="lastName" 
                      placeholder="Doe"
                      data-testid="input-register-lastName"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input 
                    id="register-email" 
                    name="email" 
                    type="email" 
                    required 
                    placeholder="admin@example.com"
                    data-testid="input-register-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input 
                    id="register-password" 
                    name="password" 
                    type="password" 
                    required 
                    minLength={6}
                    placeholder="At least 6 characters"
                    data-testid="input-register-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isRegistering}
                  data-testid="button-register"
                >
                  {isRegistering ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
