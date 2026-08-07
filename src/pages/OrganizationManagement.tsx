import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationMembersManager } from '@/components/professional/OrganizationMembersManager';
import { BroadcastManager } from '@/components/professional/BroadcastManager';
import { OrganizationSettings } from '@/components/professional/OrganizationSettings';
import { OrganizationAnalytics } from '@/components/professional/OrganizationAnalytics';
import { BundleShareToOrganization } from '@/components/professional/BundleShareToOrganization';
import { OrganizationReminderManager } from '@/components/professional/OrganizationReminderManager';
import { OrganizationEventsManager } from '@/components/professional/OrganizationEventsManager';
import { OrganizationProgramsManager } from '@/components/professional/OrganizationProgramsManager';
import { NavigationBridgeManager } from '@/components/professional/NavigationBridgeManager';
import { OrganizationHubSetup } from '@/components/professional/OrganizationHubSetup';
import { useOrganization } from '@/hooks/useOrganization';
import { useUserMode } from '@/hooks/useUserMode';
import { Loader2 } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function OrganizationManagement() {
  const navigate = useNavigate();
  const { currentMode, isProfessionalVerified, isAdmin: isSuperAdmin, loading: userLoading } = useUserMode();
  const { organization, loading: orgLoading, isAdmin } = useOrganization();

  // Get the tab from URL query parameters
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const tabParam = searchParams.get('tab') || 'hub';

  useEffect(() => {
    if (!orgLoading && !userLoading) {
      // Allow super admins to bypass verification checks
      const hasAccess = isSuperAdmin || (currentMode === 'professional' && isProfessionalVerified);

      if (!hasAccess) {
        navigate('/');
        return;
      }
      if (!organization || !isAdmin) {
        navigate('/professional-dashboard');
        return;
      }
    }
  }, [currentMode, isProfessionalVerified, isSuperAdmin, organization, isAdmin, orgLoading, userLoading, navigate]);

  if (orgLoading || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Organization Management</h1>
          <p className="text-muted-foreground">
            Manage {organization.name}'s settings, members, and communications
          </p>
        </div>

        <Tabs defaultValue={tabParam} className="space-y-6">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex w-max">
              <TabsTrigger value="hub">Public Hub</TabsTrigger>
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="programs">Programs</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
              <TabsTrigger value="bundles">Bundles</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="hub">
            <OrganizationHubSetup organizationId={organization.id} />
          </TabsContent>

          <TabsContent value="connection">
            <NavigationBridgeManager
              organizationId={organization.id}
              organizationName={organization.name}
            />
          </TabsContent>

          <TabsContent value="programs">
            <OrganizationProgramsManager organizationId={organization.id} />
          </TabsContent>

          <TabsContent value="events">
            <OrganizationEventsManager organizationId={organization.id} />
          </TabsContent>

          <TabsContent value="broadcasts">
            <BroadcastManager organizationId={organization.id} />
          </TabsContent>

          <TabsContent value="bundles">
            <BundleShareToOrganization organizationId={organization.id} />
          </TabsContent>

          <TabsContent value="reminders">
            <OrganizationReminderManager organizationId={organization.id} />
          </TabsContent>

          <TabsContent value="members">
            <OrganizationMembersManager
              organizationId={organization.id}
              organizationName={organization.name}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <OrganizationAnalytics organizationId={organization.id} />
          </TabsContent>

          <TabsContent value="settings">
            <OrganizationSettings organizationId={organization.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}