import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Package, CheckCircle2, AlertCircle, Loader2, MapPin, Phone, Clock, ArrowLeft, Home } from 'lucide-react';

interface BundleResource {
  id: string;
  name: string;
  category: string;
  description: string;
  address?: string | null;
  phone?: string | null;
  hours?: string | null;
  website?: string | null;
}

interface ClaimedBundle {
  title: string;
  description?: string | null;
  notes?: string | null;
  resources?: BundleResource[];
}

export default function ClaimBundle() {
  const [searchParams] = useSearchParams();
  const codeParam = searchParams.get('code');
  const [code, setCode] = useState(codeParam || '');
  const [loading, setLoading] = useState(false);
  const [bundle, setBundle] = useState<ClaimedBundle | null>(null);
  const [claimed, setClaimed] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (codeParam) {
      handleClaim(codeParam);
    }
  }, [codeParam]);

  const handleClaim = async (shareCode?: string) => {
    const claimCode = shareCode || code;
    if (!claimCode) {
      toast({
        title: "Error",
        description: "Please enter a bundle code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('claim-bundle', {
        body: { shareCode: claimCode },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        if (data.bundle) {
          setBundle(data.bundle);
          setClaimed(true);
        }
        return;
      }

      setBundle(data.bundle);
      setClaimed(true);
      toast({
        title: "Success!",
        description: data.message,
      });
    } catch (error) {
      console.error('Error claiming bundle:', error);
      toast({
        title: "Error",
        description: "Failed to claim bundle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderResource = (resource: BundleResource) => (
    <Card key={resource.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{resource.name}</CardTitle>
            <Badge variant="secondary">{resource.category}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{resource.description}</p>

        <Separator />

        <div className="space-y-2 text-sm">
          {resource.address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <span>{resource.address}</span>
            </div>
          )}
          {resource.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <a href={`tel:${resource.phone}`} className="hover:underline">{resource.phone}</a>
            </div>
          )}
          {resource.hours && (
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <span>{resource.hours}</span>
            </div>
          )}
        </div>

        {resource.website && (
          <Button variant="outline" className="w-full" asChild>
            <a href={resource.website} target="_blank" rel="noopener noreferrer">
              Visit Website
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} title="Go Back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} title="Home">
              <Home className="w-5 h-5" />
            </Button>
            <Package className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Claim Resource Bundle</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        {!bundle ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle>Claim Resource Bundle</CardTitle>
                  <CardDescription>
                    Enter the code you received to access curated resources
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter bundle code (e.g., BUNDLE-ABC123)"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleClaim()}
                  disabled={loading}
                />
                <Button onClick={() => handleClaim()} disabled={loading || !code}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    'Claim Bundle'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className={claimed ? "border-green-200 bg-green-50/50" : "border-yellow-200 bg-yellow-50/50"}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {claimed ? (
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                  )}
                  <div>
                    <CardTitle>{bundle.title}</CardTitle>
                    <CardDescription>
                      {claimed ? "Successfully claimed!" : "Already claimed previously"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              {bundle.description && (
                <CardContent>
                  <p className="text-sm">{bundle.description}</p>
                </CardContent>
              )}
            </Card>

            {bundle.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{bundle.notes}</p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Resources ({bundle.resources?.length || 0})</h2>
              <div className="grid gap-4">
                {bundle.resources?.map(renderResource)}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => navigate('/community')} variant="outline" className="flex-1">
                Back to Home
              </Button>
              <Button onClick={() => window.print()} variant="secondary" className="flex-1">
                Print Resources
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
