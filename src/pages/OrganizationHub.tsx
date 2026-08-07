import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrganizationConnection } from "@/hooks/useOrganizationConnection";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, Calendar, MapPin, Clock, Phone,
  Link2, Users, Heart, AlertCircle, Mail, Globe,
  MessageSquare, Sparkles, ArrowLeft, CheckCircle2
} from "lucide-react";

interface OrganizationData {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  services: string[] | null;
}

interface Program {
  id: string;
  name: string;
  description: string;
  eligibility: string | null;
  hours: string | null;
  contact_info: string | null;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
}

export default function OrganizationHub() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isConnected, connectToOrganization } = useOrganizationConnection();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizationHub();
  }, [slug]);

  const loadOrganizationHub = async () => {
    try {
      let org = null;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (uuidRegex.test(slug || '')) {
        const { data: orgById, error: idError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', slug)
          .maybeSingle();

        if (!idError && orgById) {
          org = orgById;
        }
      }

      if (!org) {
        const { data: orgs, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .ilike('name', `%${slug}%`)
          .limit(1);

        if (orgError) throw orgError;
        if (orgs && orgs.length > 0) {
          org = orgs[0];
        }
      }

      if (!org) {
        toast({
          title: "Organization Not Found",
          description: "This organization hub does not exist",
          variant: "destructive",
        });
        return;
      }

      setOrganization(org);

      const { data: programsData } = await supabase
        .from('organization_programs')
        .select('*')
        .eq('organization_id', org.id)
        .eq('is_active', true)
        .order('display_order');

      setPrograms(programsData || []);

      const { data: eventsData } = await supabase
        .from('organization_events')
        .select('*')
        .eq('organization_id', org.id)
        .eq('is_public', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time')
        .limit(5);

      setEvents(eventsData || []);

    } catch (error) {
      console.error('Error loading organization hub:', error);
      toast({
        title: "Error",
        description: "Failed to load organization information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (organization) {
      const success = await connectToOrganization(organization.id);
      if (success) {
        toast({
          title: "Connected!",
          description: `You're now connected to ${organization.name}`,
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <Building2 className="absolute inset-0 m-auto h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground font-medium">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-destructive/5">
        <Card className="max-w-md border-destructive/20 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>Organization Not Found</CardTitle>
            <CardDescription>
              This organization hub does not exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/browse-organizations')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse Organizations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

        <div className="relative container max-w-5xl mx-auto px-4 py-16 md:py-24">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Logo/Icon */}
            <div className="shrink-0">
              {organization.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={`${organization.name} logo`}
                  className="h-28 w-28 rounded-2xl bg-white/10 backdrop-blur-sm p-2 object-contain"
                />
              ) : (
                <div className="h-28 w-28 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Building2 className="h-14 w-14 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-3">
                {organization.name}
              </h1>
              <p className="text-lg text-primary-foreground/80 max-w-2xl mb-6">
                {organization.description || "Community resources and support services to help you navigate life's challenges."}
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
                {programs.length > 0 && (
                  <Badge className="bg-white/20 text-primary-foreground border-0 backdrop-blur-sm py-1.5 px-3">
                    <Users className="w-4 h-4 mr-1.5" />
                    {programs.length} Programs
                  </Badge>
                )}
                {events.length > 0 && (
                  <Badge className="bg-white/20 text-primary-foreground border-0 backdrop-blur-sm py-1.5 px-3">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    {events.length} Upcoming Events
                  </Badge>
                )}
                {organization.services && organization.services.length > 0 && (
                  <Badge className="bg-white/20 text-primary-foreground border-0 backdrop-blur-sm py-1.5 px-3">
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    {organization.services.length} Services
                  </Badge>
                )}
              </div>

              {/* CTA */}
              {!isConnected ? (
                <Button
                  size="lg"
                  onClick={handleConnect}
                  className="bg-white text-primary hover:bg-white/90 shadow-lg"
                >
                  <Link2 className="w-5 h-5 mr-2" />
                  Connect with Us
                </Button>
              ) : (
                <Badge className="bg-green-500/20 text-green-100 border-green-400/30 text-base py-2 px-4">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Connected
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* Contact Info Bar */}
        {(organization.phone || organization.email || organization.address || organization.website) && (
          <Card className="bg-muted/30 border-muted">
            <CardContent className="py-4">
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                {organization.phone && (
                  <a href={`tel:${organization.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="w-4 h-4" />
                    {organization.phone}
                  </a>
                )}
                {organization.email && (
                  <a href={`mailto:${organization.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="w-4 h-4" />
                    {organization.email}
                  </a>
                )}
                {organization.website && (
                  <a href={organization.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
                {organization.address && (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {organization.address}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services Tags */}
        {organization.services && organization.services.length > 0 && (
          <div className="text-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Our Services</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {organization.services.map((service, i) => (
                <Badge key={i} variant="secondary" className="capitalize">
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Programs Section */}
        {programs.length > 0 && (
          <section className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold">Programs & Services</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {programs.map((program) => (
                <Card key={program.id} className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {program.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {program.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {program.eligibility && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                        <span><span className="font-medium text-foreground">Eligibility:</span> {program.eligibility}</span>
                      </div>
                    )}
                    {program.hours && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4 text-orange-500" />
                        {program.hours}
                      </div>
                    )}
                    {program.contact_info && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4 text-blue-500" />
                        {program.contact_info}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Events Section */}
        {events.length > 0 && (
          <section className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold">Upcoming Events</h2>
            </div>
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id} className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                  <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Date Badge */}
                      <div className="shrink-0 text-center bg-primary/5 rounded-xl p-3 md:w-20">
                        <div className="text-xs font-medium text-primary uppercase">
                          {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {new Date(event.start_time).getDate()}
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {event.title}
                          </h3>
                          <Badge variant="outline" className="capitalize shrink-0">
                            {event.event_type}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                            {event.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(event.start_time).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Empty State - Show when no programs or events */}
        {programs.length === 0 && events.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">More Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              This organization is setting up their hub. Connect with them to receive updates when new programs and events are added.
            </p>
          </div>
        )}

        {/* Connection CTA */}
        {!isConnected && (
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardContent className="py-10 relative">
              <div className="text-center space-y-4 max-w-lg mx-auto">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">
                  Get Connected for Support
                </h3>
                <p className="text-muted-foreground">
                  Connect with {organization.name} to access support threads, receive updates,
                  and get personalized help navigating community resources.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button size="lg" onClick={handleConnect} className="shadow-lg">
                    <Link2 className="w-5 h-5 mr-2" />
                    Connect Now
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/browse-organizations')}>
                    Browse Other Organizations
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connected User Actions */}
        {isConnected && (
          <Card className="border-green-500/20 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">You're connected to {organization.name}</p>
                    <p className="text-sm text-muted-foreground">Access support and receive updates</p>
                  </div>
                </div>
                <Button onClick={() => navigate('/support-threads')}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message Organization
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}