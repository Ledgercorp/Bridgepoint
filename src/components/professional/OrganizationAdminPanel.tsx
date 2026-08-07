import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOrganization } from '@/hooks/useOrganization';
import { demoOrganization, adminPreviewOrganization, demoMembers, demoSeatUsage, adminPreviewMembers, adminPreviewSeatUsage } from '@/utils/demoData';
import { Building2, Users, UserPlus, Settings, Trash2, Shield, Mail, Calendar, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface OrganizationAdminPanelProps {
  demoMode?: boolean;
  adminPreviewMode?: boolean;
}

export function OrganizationAdminPanel({ demoMode = false, adminPreviewMode = false }: OrganizationAdminPanelProps) {
  const { toast } = useToast();
  const { organization, members, seatUsage, isAdmin, loading, inviteMember, removeMember, updateMemberRole, updateOrganization } = useOrganization();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgDomain, setOrgDomain] = useState('');

  // Use sample data for demo mode or admin preview mode
  const useSampleData = demoMode || adminPreviewMode;

  // Admin preview uses fresh/empty data, demo mode uses populated sample data
  const sampleOrg = adminPreviewMode ? adminPreviewOrganization : demoOrganization;
  const sampleMembers = adminPreviewMode ? adminPreviewMembers : demoMembers;
  const sampleSeatUsage = adminPreviewMode ? adminPreviewSeatUsage : demoSeatUsage;

  const displayOrg = useSampleData ? sampleOrg : organization;
  const displayMembers = useSampleData ? sampleMembers : members;
  const displaySeatUsage = useSampleData ? sampleSeatUsage : seatUsage;
  const displayIsAdmin = useSampleData ? true : isAdmin;

  // Only disable actions if using sample data
  const actionsDisabled = useSampleData;

  if (loading && !useSampleData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (!displayOrg && !useSampleData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Organization</CardTitle>
          <CardDescription>You are not part of any organization yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!displayIsAdmin && !useSampleData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>Only organization administrators can access this panel.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleInvite = async () => {
    if (actionsDisabled) {
      toast({
        title: actionsDisabled ? "Preview Mode" : "Demo Mode",
        description: "Member invitations are disabled in preview mode"
      });
      return;
    }
    if (!inviteEmail) return;
    const success = await inviteMember(inviteEmail, inviteRole);
    if (success) {
      setInviteEmail('');
      setInviteRole('member');
    }
  };

  const handleRemoveMember = async () => {
    if (actionsDisabled) {
      toast({
        title: actionsDisabled ? "Preview Mode" : "Demo Mode",
        description: "Member removal is disabled in preview mode"
      });
      setMemberToRemove(null);
      return;
    }
    if (!memberToRemove) return;
    await removeMember(memberToRemove);
    setMemberToRemove(null);
  };

  const handleUpdateOrg = async () => {
    if (actionsDisabled) {
      toast({
        title: actionsDisabled ? "Preview Mode" : "Demo Mode",
        description: "Organization updates are disabled in preview mode"
      });
      return;
    }
    await updateOrganization({
      name: orgName || displayOrg.name,
      domain: orgDomain || displayOrg.domain || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {demoMode && (
        <Alert className="border-purple-500/50 bg-purple-500/10">
          <Info className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-900 dark:text-purple-100">
            You're viewing sample organization data. Actions like inviting members or updating settings are disabled in demo mode.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Organization Admin</h2>
          <p className="text-muted-foreground">Manage your organization and team</p>
        </div>
        <Badge variant={displayOrg.subscription_status === 'active' ? 'default' : 'destructive'}>
          {displayOrg.subscription_status}
        </Badge>
      </div>

      {/* Seat Usage Summary */}
      {displaySeatUsage && (
        <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Seat Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-3xl font-bold text-primary">{displaySeatUsage.total_seats}</p>
                <p className="text-sm text-muted-foreground">Total Seats</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-3xl font-bold">{displaySeatUsage.used_seats}</p>
                <p className="text-sm text-muted-foreground">Used</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-3xl font-bold text-green-500">{displaySeatUsage.available_seats}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
            {displaySeatUsage.available_seats === 0 && (
              <p className="text-sm text-amber-500 mt-4 text-center">
                ⚠️ No seats available. Contact support to add more seats.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="invite">Invite Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members ({displayMembers.length})
              </CardTitle>
              <CardDescription>Manage your organization's team members and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">
                            {member.user_profiles?.display_name || member.user_profiles?.first_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.user_profiles?.email}</p>
                        </div>
                        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Joined {format(new Date(member.joined_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(value) => !actionsDisabled && updateMemberRole(member.id, value as 'admin' | 'member')}
                        disabled={actionsDisabled}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMemberToRemove(member.id)}
                        disabled={actionsDisabled}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Invite Team Members
              </CardTitle>
              <CardDescription>
                {displaySeatUsage && displaySeatUsage.available_seats > 0
                  ? `You have ${displaySeatUsage.available_seats} seat${displaySeatUsage.available_seats === 1 ? '' : 's'} available`
                  : 'No seats available. Please contact support to add more seats.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@example.org"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={actionsDisabled || !displaySeatUsage || displaySeatUsage.available_seats === 0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={(value: 'admin' | 'member') => setInviteRole(value)}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      <div>
                        <p className="font-medium">Member</p>
                        <p className="text-xs text-muted-foreground">Can use Professional Mode tools</p>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div>
                        <p className="font-medium">Admin</p>
                        <p className="text-xs text-muted-foreground">Can manage team and settings</p>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleInvite}
                className="w-full"
                disabled={actionsDisabled || !inviteEmail || !displaySeatUsage || displaySeatUsage.available_seats === 0}
                data-tour="invite-members-btn"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Organization Settings
              </CardTitle>
              <CardDescription>Update your organization's information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  defaultValue={displayOrg.name}
                  onChange={(e) => setOrgName(e.target.value)}
                  disabled={actionsDisabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-domain">Organization Domain</Label>
                <Input
                  id="org-domain"
                  defaultValue={displayOrg.domain || ''}
                  onChange={(e) => setOrgDomain(e.target.value)}
                  placeholder="example.org"
                  disabled={actionsDisabled}
                />
                <p className="text-xs text-muted-foreground">
                  Team members with this email domain can join more easily
                </p>
              </div>

              <Button onClick={handleUpdateOrg} disabled={actionsDisabled}>
                Save Changes
              </Button>

              <div className="pt-6 border-t space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Subscription Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={displayOrg.subscription_status === 'active' ? 'default' : 'destructive'}>
                      {displayOrg.subscription_status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Seats</p>
                    <p className="font-medium">{displayOrg.subscription_seats}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this team member? They will lose access to Professional Mode immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember}>
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
