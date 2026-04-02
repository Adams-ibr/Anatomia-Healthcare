import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2, 
  Crown, 
  Search,
  UserCog,
  GraduationCap,
  Plus
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Member } from "@shared/schema";
import { format } from "date-fns";

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  profileImageUrl: string | null;
  isActive: boolean | null;
  createdAt: string;
  updatedAt: string;
}

const roleLabels: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  super_admin: { label: "Super Admin", color: "destructive", icon: ShieldAlert },
  content_admin: { label: "Content Admin", color: "default", icon: ShieldCheck },
  reviewer: { label: "Reviewer", color: "secondary", icon: Shield },
};

const tierColors: Record<string, string> = {
  bronze: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  silver: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  gold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  diamond: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function AdminUserManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("admins");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  
  const [isEditMembershipOpen, setIsEditMembershipOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [membershipForm, setMembershipForm] = useState({ tier: "bronze", expiresAt: "" });
  
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [createAdminForm, setCreateAdminForm] = useState({
    email: "",
    password: "",
    role: "content_admin",
    firstName: "",
    lastName: "",
  });

  const { data: adminUsers = [], isLoading: isLoadingAdmins } = useQuery<AdminUser[]>({
    queryKey: ["/api/lms/admin/users"],
  });

  const { data: members = [], isLoading: isLoadingMembers } = useQuery<Member[]>({
    queryKey: ["/api/lms/admin/members"],
  });

  const updateAdminRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const response = await apiRequest("PATCH", `/api/lms/admin/users/${id}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/users"] });
      toast({ title: "Role updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update role", description: error.message, variant: "destructive" });
    },
  });

  const updateAdminStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/lms/admin/users/${id}/status`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/users"] });
      toast({ title: "Status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/lms/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/users"] });
      toast({ title: "Admin user deleted successfully" });
      setAdminToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete admin user", description: error.message, variant: "destructive" });
    },
  });

  const updateMembershipMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { tier: string; expiresAt?: string | null } }) => {
      const response = await apiRequest("PATCH", `/api/lms/admin/members/${id}/membership`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/members"] });
      toast({ title: "Membership updated successfully" });
      setIsEditMembershipOpen(false);
      setEditingMember(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update membership", description: error.message, variant: "destructive" });
    },
  });

  const updateMemberStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/lms/admin/members/${id}/status`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/members"] });
      toast({ title: "Member status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update member status", description: error.message, variant: "destructive" });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/lms/admin/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/members"] });
      toast({ title: "Member deleted successfully" });
      setMemberToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete member", description: error.message, variant: "destructive" });
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; role: string; firstName?: string; lastName?: string }) => {
      const response = await apiRequest("POST", "/api/lms/admin/users", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/users"] });
      toast({ title: "Admin user created successfully" });
      setIsCreateAdminOpen(false);
      setCreateAdminForm({ email: "", password: "", role: "content_admin", firstName: "", lastName: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create admin user", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    createAdminMutation.mutate({
      email: createAdminForm.email,
      password: createAdminForm.password,
      role: createAdminForm.role,
      firstName: createAdminForm.firstName || undefined,
      lastName: createAdminForm.lastName || undefined,
    });
  };

  const filteredAdmins = adminUsers.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      (user.firstName?.toLowerCase() || "").includes(searchLower) ||
      (user.lastName?.toLowerCase() || "").includes(searchLower)
    );
  });

  const filteredMembers = members.filter((member) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      member.email.toLowerCase().includes(searchLower) ||
      (member.firstName?.toLowerCase() || "").includes(searchLower) ||
      (member.lastName?.toLowerCase() || "").includes(searchLower)
    );
  });

  const handleEditMembership = (member: Member) => {
    setEditingMember(member);
    setMembershipForm({
      tier: member.membershipTier || "bronze",
      expiresAt: member.membershipExpiresAt 
        ? new Date(member.membershipExpiresAt).toISOString().split("T")[0] 
        : "",
    });
    setIsEditMembershipOpen(true);
  };

  const handleSaveMembership = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      updateMembershipMutation.mutate({
        id: editingMember.id,
        data: {
          tier: membershipForm.tier,
          expiresAt: membershipForm.expiresAt || null,
        },
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleBadge = (role: string) => {
    const roleInfo = roleLabels[role] || { label: role, color: "outline", icon: Shield };
    const IconComponent = roleInfo.icon;
    return (
      <Badge variant={roleInfo.color as any} className="gap-1">
        <IconComponent className="h-3 w-3" />
        {roleInfo.label}
      </Badge>
    );
  };

  const tierCounts = members.reduce((acc, member) => {
    const tier = member.membershipTier || "bronze";
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">User Management</h1>
            <p className="text-muted-foreground">Manage all users - administrators and members</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <UserCog className="h-3 w-3" />
              {adminUsers.length} Admins
            </Badge>
            <Badge variant="outline" className="gap-1">
              <GraduationCap className="h-3 w-3" />
              {members.length} Members
            </Badge>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-users"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="admins" data-testid="tab-admins" className="gap-2">
              <UserCog className="h-4 w-4" />
              Admin Users ({filteredAdmins.length})
            </TabsTrigger>
            <TabsTrigger value="members" data-testid="tab-members" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Members ({filteredMembers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="admins" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Administrator Accounts
                </CardTitle>
                <Button onClick={() => setIsCreateAdminOpen(true)} data-testid="button-create-admin">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Admin
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingAdmins ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredAdmins.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No admin users match your search" : "No admin users found"}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAdmins.map((user) => (
                        <TableRow key={user.id} data-testid={`row-admin-${user.id}`}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {user.firstName || user.lastName
                                  ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                  : "No name"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value) => updateAdminRoleMutation.mutate({ id: user.id, role: value })}
                              disabled={updateAdminRoleMutation.isPending}
                            >
                              <SelectTrigger className="w-[160px]" data-testid={`select-admin-role-${user.id}`}>
                                <SelectValue>{getRoleBadge(user.role)}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="super_admin">
                                  <div className="flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-destructive" />
                                    Super Admin
                                  </div>
                                </SelectItem>
                                <SelectItem value="content_admin">
                                  <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4" />
                                    Content Admin
                                  </div>
                                </SelectItem>
                                <SelectItem value="reviewer">
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Reviewer
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={user.isActive ?? true}
                                onCheckedChange={() => updateAdminStatusMutation.mutate({ id: user.id, isActive: !(user.isActive ?? true) })}
                                disabled={updateAdminStatusMutation.isPending}
                                data-testid={`switch-admin-status-${user.id}`}
                              />
                              <span className="text-sm text-muted-foreground">
                                {user.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(user.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setAdminToDelete(user)}
                              data-testid={`button-delete-admin-${user.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="mt-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["bronze", "silver", "gold", "diamond"].map((tier) => (
                <Card key={tier}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground capitalize">{tier}</p>
                        <p className="text-2xl font-bold">{tierCounts[tier] || 0}</p>
                      </div>
                      <Crown className={`w-8 h-8 ${
                        tier === "diamond" ? "text-purple-500" :
                        tier === "gold" ? "text-yellow-500" :
                        tier === "silver" ? "text-gray-400" :
                        "text-orange-500"
                      }`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Members / Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingMembers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No members match your search" : "No members found"}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Membership</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => (
                        <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {member.firstName || member.lastName 
                                  ? `${member.firstName || ""} ${member.lastName || ""}`.trim() 
                                  : "No name"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {member.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={tierColors[member.membershipTier || "bronze"]}>
                              <Crown className="w-3 h-3 mr-1" />
                              {(member.membershipTier || "bronze").charAt(0).toUpperCase() + 
                               (member.membershipTier || "bronze").slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={member.isActive ?? true}
                                onCheckedChange={() => updateMemberStatusMutation.mutate({ id: member.id, isActive: !(member.isActive ?? true) })}
                                disabled={updateMemberStatusMutation.isPending}
                                data-testid={`switch-member-status-${member.id}`}
                              />
                              <span className="text-sm text-muted-foreground">
                                {(member.isActive ?? true) ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {member.membershipExpiresAt 
                                ? format(new Date(member.membershipExpiresAt), "MMM d, yyyy")
                                : member.membershipTier === "bronze" ? "Never" : "Not set"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {member.createdAt 
                                ? format(new Date(member.createdAt), "MMM d, yyyy")
                                : "-"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditMembership(member)}
                                data-testid={`button-edit-membership-${member.id}`}
                              >
                                Edit Tier
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setMemberToDelete(member)}
                                data-testid={`button-delete-member-${member.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isEditMembershipOpen} onOpenChange={setIsEditMembershipOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Membership</DialogTitle>
            <DialogDescription>
              Update membership tier and expiration for{" "}
              <span className="font-medium">{editingMember?.email}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveMembership}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tier">Membership Tier</Label>
                <Select
                  value={membershipForm.tier}
                  onValueChange={(value) => setMembershipForm({ ...membershipForm, tier: value })}
                >
                  <SelectTrigger data-testid="select-membership-tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">Bronze (Free)</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="diamond">Diamond</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiresAt">Expiration Date</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={membershipForm.expiresAt}
                  onChange={(e) => setMembershipForm({ ...membershipForm, expiresAt: e.target.value })}
                  disabled={membershipForm.tier === "bronze"}
                  data-testid="input-membership-expires"
                />
                <p className="text-xs text-muted-foreground">
                  {membershipForm.tier === "bronze" 
                    ? "Bronze tier has no expiration" 
                    : "Leave empty for no expiration"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditMembershipOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateMembershipMutation.isPending}
                data-testid="button-save-membership"
              >
                Update Membership
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!adminToDelete} onOpenChange={() => setAdminToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the admin user "{adminToDelete?.email}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-admin">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => adminToDelete && deleteAdminMutation.mutate(adminToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-admin"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the member "{memberToDelete?.email}"? 
              This will also delete their enrollment data and progress. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-member">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToDelete && deleteMemberMutation.mutate(memberToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-member"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCreateAdminOpen} onOpenChange={setIsCreateAdminOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Admin User</DialogTitle>
            <DialogDescription>
              Add a new administrator account with the selected role.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAdmin}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={createAdminForm.firstName}
                    onChange={(e) => setCreateAdminForm({ ...createAdminForm, firstName: e.target.value })}
                    placeholder="John"
                    data-testid="input-admin-firstname"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={createAdminForm.lastName}
                    onChange={(e) => setCreateAdminForm({ ...createAdminForm, lastName: e.target.value })}
                    placeholder="Doe"
                    data-testid="input-admin-lastname"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={createAdminForm.email}
                  onChange={(e) => setCreateAdminForm({ ...createAdminForm, email: e.target.value })}
                  placeholder="admin@example.com"
                  required
                  data-testid="input-admin-email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={createAdminForm.password}
                  onChange={(e) => setCreateAdminForm({ ...createAdminForm, password: e.target.value })}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  data-testid="input-admin-password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={createAdminForm.role}
                  onValueChange={(value) => setCreateAdminForm({ ...createAdminForm, role: value })}
                >
                  <SelectTrigger data-testid="select-admin-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                        Super Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="content_admin">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Content Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="reviewer">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Reviewer
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateAdminOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createAdminMutation.isPending}
                data-testid="button-save-admin"
              >
                Create Admin
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
