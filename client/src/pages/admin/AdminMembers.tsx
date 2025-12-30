import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Crown, Users, Search } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Member } from "@shared/schema";
import { format } from "date-fns";

const tierColors: Record<string, string> = {
  bronze: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  silver: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  gold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  diamond: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function AdminMembers() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    tier: "bronze",
    expiresAt: "",
  });

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["/api/lms/admin/members"],
  });

  const updateMembershipMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { tier: string; expiresAt?: string | null } }) => {
      const response = await apiRequest("PATCH", `/api/lms/admin/members/${id}/membership`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/members"] });
      toast({ title: "Membership updated successfully" });
      setIsDialogOpen(false);
      setEditingMember(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update membership", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      tier: member.membershipTier || "bronze",
      expiresAt: member.membershipExpiresAt 
        ? new Date(member.membershipExpiresAt).toISOString().split("T")[0] 
        : "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      updateMembershipMutation.mutate({
        id: editingMember.id,
        data: {
          tier: formData.tier,
          expiresAt: formData.expiresAt || null,
        },
      });
    }
  };

  const filteredMembers = members.filter((member) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      member.email.toLowerCase().includes(searchLower) ||
      (member.firstName?.toLowerCase() || "").includes(searchLower) ||
      (member.lastName?.toLowerCase() || "").includes(searchLower)
    );
  });

  const tierCounts = members.reduce((acc, member) => {
    const tier = member.membershipTier || "bronze";
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout title="Member Management">
      <div className="space-y-6">
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

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-members"
            />
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : filteredMembers.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Membership</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                      <TableCell className="font-medium">
                        {member.firstName || member.lastName 
                          ? `${member.firstName || ""} ${member.lastName || ""}`.trim() 
                          : "No name"}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge className={tierColors[member.membershipTier || "bronze"]}>
                          <Crown className="w-3 h-3 mr-1" />
                          {(member.membershipTier || "bronze").charAt(0).toUpperCase() + 
                           (member.membershipTier || "bronze").slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.membershipExpiresAt 
                          ? format(new Date(member.membershipExpiresAt), "MMM d, yyyy")
                          : member.membershipTier === "bronze" ? "Never" : "Not set"}
                      </TableCell>
                      <TableCell>
                        {member.createdAt 
                          ? format(new Date(member.createdAt), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(member)}
                          data-testid={`button-edit-membership-${member.id}`}
                        >
                          Edit Membership
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">
                {searchQuery ? "No members found" : "No members yet"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "Try adjusting your search query" 
                  : "Members will appear here once they register"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Membership</DialogTitle>
            <DialogDescription>
              Update membership tier and expiration for{" "}
              <span className="font-medium">{editingMember?.email}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tier">Membership Tier</Label>
                <Select
                  value={formData.tier}
                  onValueChange={(value) => setFormData({ ...formData, tier: value })}
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
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  disabled={formData.tier === "bronze"}
                  data-testid="input-membership-expires"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.tier === "bronze" 
                    ? "Bronze tier has no expiration" 
                    : "Leave empty for no expiration"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
    </AdminLayout>
  );
}
