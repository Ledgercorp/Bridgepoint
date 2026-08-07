import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConnectionStatus {
  isConnected: boolean;
  organizationId: string | null;
  organizationName: string | null;
  connectionCode: string | null;
  connectedAt: string | null;
  loading: boolean;
}

export const useOrganizationConnection = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    organizationId: null,
    organizationName: null,
    connectionCode: null,
    connectedAt: null,
    loading: true,
  });
  const { toast } = useToast();

  const loadConnection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setStatus({
          isConnected: false,
          organizationId: null,
          organizationName: null,
          connectionCode: null,
          connectedAt: null,
          loading: false,
        });
        return;
      }

      // Get user's active connections
      const { data: connections, error } = await supabase
        .from('organization_connections')
        .select(`
          id,
          organization_id,
          connection_code,
          connected_at,
          organizations:organization_id (
            id,
            name
          )
        `)
        .eq('user_id', session.user.id)
        .eq('is_active', true);

      if (error) throw error;

      if (connections && connections.length > 0) {
        // For now, use the first connection (could support multiple later)
        const connection = connections[0];
        const org = connection.organizations;

        setStatus({
          isConnected: true,
          organizationId: connection.organization_id,
          organizationName: org?.name || null,
          connectionCode: connection.connection_code,
          connectedAt: connection.connected_at,
          loading: false,
        });
      } else {
        setStatus({
          isConnected: false,
          organizationId: null,
          organizationName: null,
          connectionCode: null,
          connectedAt: null,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error loading connection:', error);
      setStatus({
        isConnected: false,
        organizationId: null,
        organizationName: null,
        connectionCode: null,
        connectedAt: null,
        loading: false,
      });
    }
  };

  const connectToOrganization = async (organizationId: string, providedCode?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Get the organization's persistent connection code
      let connectionCode = providedCode;
      if (!connectionCode) {
        const { data: codeData, error: codeError } = await supabase.rpc(
          'generate_org_connection_code',
          { org_id: organizationId }
        );

        if (codeError) throw codeError;
        connectionCode = codeData;
      }

      const { error } = await supabase
        .from('organization_connections')
        .insert({
          organization_id: organizationId,
          user_id: session.user.id,
          connection_code: connectionCode,
        });

      if (error) throw error;

      toast({
        title: "Connected!",
        description: "You're now connected to this organization",
      });

      await loadConnection();
      return true;
    } catch (error) {
      console.error('Error connecting to organization:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect to organization",
        variant: "destructive",
      });
      return false;
    }
  };

  const disconnectFromOrganization = async (organizationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('organization_connections')
        .update({ is_active: false })
        .eq('organization_id', organizationId)
        .eq('user_id', session.user.id);

      if (error) throw error;

      toast({
        title: "Disconnected",
        description: "You've been disconnected from this organization",
      });

      await loadConnection();
      return true;
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Disconnection Failed",
        description: error.message || "Could not disconnect",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    loadConnection();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadConnection();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    ...status,
    connectToOrganization,
    disconnectFromOrganization,
    refreshConnection: loadConnection,
  };
};
