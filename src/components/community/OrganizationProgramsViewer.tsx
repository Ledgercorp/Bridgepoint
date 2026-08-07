import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, Users, Phone, Mail, MessageSquare, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Program {
  id: string;
  name: string;
  description: string;
  eligibility: string | null;
  hours: string | null;
  contact_info: string | null;
  display_order: number;
}

interface OrganizationProgramsViewerProps {
  organizationId: string;
}

export const OrganizationProgramsViewer = ({ organizationId }: OrganizationProgramsViewerProps) => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPrograms();
  }, [organizationId]);

  const loadPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_programs')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      setPrograms(data || []);
    } catch (error) {
      console.error('Error loading programs:', error);
      toast({
        title: "Error",
        description: "Could not load programs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = (contactInfo: string | null) => {
    if (!contactInfo) return;

    // Check if it's a phone number
    if (contactInfo.match(/^\+?[\d\s\-().]+$/)) {
      window.location.href = `tel:${contactInfo.replace(/\D/g, '')}`;
    }
    // Check if it's an email
    else if (contactInfo.includes('@')) {
      window.location.href = `mailto:${contactInfo}`;
    }
    // Otherwise treat as general text
    else {
      toast({
        title: "Contact Information",
        description: contactInfo,
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading programs...</div>
        </CardContent>
      </Card>
    );
  }

  if (programs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Available Programs
          </CardTitle>
          <CardDescription>Services and programs offered by your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No programs available at this time
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Available Programs
        </CardTitle>
        <CardDescription>Services and programs offered by your organization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {programs.map((program) => (
          <div
            key={program.id}
            className="p-4 border-2 rounded-lg bg-gradient-to-br from-background to-primary/5 space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-lg">{program.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">{program.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {program.eligibility && (
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium text-foreground">Eligibility</div>
                      <div className="text-muted-foreground">{program.eligibility}</div>
                    </div>
                  </div>
                )}

                {program.hours && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium text-foreground">Hours</div>
                      <div className="text-muted-foreground">{program.hours}</div>
                    </div>
                  </div>
                )}

                {program.contact_info && (
                  <div className="flex items-start gap-2 md:col-span-2">
                    <Phone className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium text-foreground">Contact</div>
                      <div className="text-muted-foreground">{program.contact_info}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {program.contact_info && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleContactClick(program.contact_info)}
                >
                  {program.contact_info.includes('@') ? (
                    <><Mail className="h-3 w-3 mr-1" /> Email</>
                  ) : program.contact_info.match(/^\+?[\d\s\-().]+$/) ? (
                    <><Phone className="h-3 w-3 mr-1" /> Call</>
                  ) : (
                    <><Phone className="h-3 w-3 mr-1" /> Contact</>
                  )}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/support-threads')}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Ask About This
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/?search=true')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Find Related Resources
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};