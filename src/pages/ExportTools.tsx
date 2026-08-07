import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUserMode } from "@/hooks/useUserMode";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import jsPDF from 'jspdf';
import {
  ArrowLeft, Loader2, Download, FileText,
  Table, FileJson, FileSpreadsheet, Building2
} from "lucide-react";

interface Bundle {
  id: string;
  title: string;
  description: string | null;
  resources: Json;
  created_at: string;
}

interface BundleResource {
  name?: string;
  address?: string;
  phone?: string;
  hours?: string;
  website?: string;
}

export default function ExportTools() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isProfessionalVerified, isAdmin: isSuperAdmin, loading: userLoading } = useUserMode();
  const { organization } = useOrganization();

  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'json' | 'csv'>('pdf');
  const [includeBranding, setIncludeBranding] = useState(true);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const hasAccess = isProfessionalVerified || isSuperAdmin;

  useEffect(() => {
    if (hasAccess) {
      loadBundles();
    }
  }, [hasAccess]);

  useEffect(() => {
    if (!userLoading && !loading && !hasAccess) {
      navigate('/');
    }
  }, [hasAccess, userLoading, loading, navigate]);

  const loadBundles = async () => {
    try {
      const { data, error } = await supabase
        .from('resource_bundles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBundles(data || []);
    } catch (error) {
      console.error('Error loading bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = (bundle: Bundle) => {
    const doc = new jsPDF();
    let yPos = 20;
    const resources = (Array.isArray(bundle.resources) ? bundle.resources : []) as BundleResource[];

    // Header with branding
    if (includeBranding && organization) {
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246); // Primary blue
      doc.text(organization.name, 20, yPos);
      yPos += 15;
    }

    // Bundle title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(bundle.title, 20, yPos);
    yPos += 8;

    // Description
    if (bundle.description) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      const descLines = doc.splitTextToSize(bundle.description, 170);
      doc.text(descLines, 20, yPos);
      yPos += descLines.length * 5 + 5;
    }

    // Resources
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Resources:', 20, yPos);
    yPos += 8;

    resources.forEach((resource, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`${index + 1}. ${resource.name}`, 25, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setTextColor(100);

      if (resource.address) {
        doc.text(`   Address: ${resource.address}`, 25, yPos);
        yPos += 5;
      }
      if (resource.phone) {
        doc.text(`   Phone: ${resource.phone}`, 25, yPos);
        yPos += 5;
      }
      if (resource.hours) {
        doc.text(`   Hours: ${resource.hours}`, 25, yPos);
        yPos += 5;
      }
      if (resource.website) {
        doc.text(`   Website: ${resource.website}`, 25, yPos);
        yPos += 5;
      }
      yPos += 3;
    });

    // Footer
    if (includeBranding) {
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Generated on ${new Date().toLocaleDateString()} via BridgePoint`, 20, 285);
    }

    doc.save(`${bundle.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  const exportToJSON = (bundle: Bundle) => {
    const exportData = {
      title: bundle.title,
      description: bundle.description,
      resources: bundle.resources,
      exportedAt: new Date().toISOString(),
      ...(includeBranding && organization ? { organization: organization.name } : {})
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bundle.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = (bundle: Bundle) => {
    const headers = ['Name', 'Address', 'Phone', 'Hours', 'Website'];
    const resources = (Array.isArray(bundle.resources) ? bundle.resources : []) as BundleResource[];
    const rows = resources.map((r) => [
      r.name || '',
      r.address || '',
      r.phone || '',
      r.hours || '',
      r.website || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bundle.title.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const bundle = bundles.find(b => b.id === selectedBundle);
    if (!bundle) {
      toast({
        variant: "destructive",
        title: "No Bundle Selected",
        description: "Please select a bundle to export",
      });
      return;
    }

    setExporting(true);
    try {
      switch (exportFormat) {
        case 'pdf':
          exportToPDF(bundle);
          break;
        case 'json':
          exportToJSON(bundle);
          break;
        case 'csv':
          exportToCSV(bundle);
          break;
      }
      toast({
        title: "Export Complete",
        description: `${bundle.title} exported as ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export bundle",
      });
    } finally {
      setExporting(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/professional-dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 mt-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Advanced Export Tools</h1>
              <p className="text-muted-foreground">
                Export to PDF, Excel, or custom formats with branding
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Configuration</CardTitle>
              <CardDescription>
                Select a bundle and choose your export options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Select Bundle *</Label>
                <Select value={selectedBundle} onValueChange={setSelectedBundle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a bundle to export" />
                  </SelectTrigger>
                  <SelectContent>
                    {bundles.map((bundle) => (
                      <SelectItem key={bundle.id} value={bundle.id}>
                        {bundle.title} ({bundle.resources?.length || 0} resources)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Export Format</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                    className="h-20 flex-col"
                    onClick={() => setExportFormat('pdf')}
                  >
                    <FileText className="w-6 h-6 mb-2" />
                    PDF
                  </Button>
                  <Button
                    variant={exportFormat === 'csv' ? 'default' : 'outline'}
                    className="h-20 flex-col"
                    onClick={() => setExportFormat('csv')}
                  >
                    <FileSpreadsheet className="w-6 h-6 mb-2" />
                    CSV/Excel
                  </Button>
                  <Button
                    variant={exportFormat === 'json' ? 'default' : 'outline'}
                    className="h-20 flex-col"
                    onClick={() => setExportFormat('json')}
                  >
                    <FileJson className="w-6 h-6 mb-2" />
                    JSON
                  </Button>
                </div>
              </div>

              {organization && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="branding"
                    checked={includeBranding}
                    onCheckedChange={(checked) => setIncludeBranding(checked as boolean)}
                  />
                  <Label htmlFor="branding" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Include organization branding
                  </Label>
                </div>
              )}

              <Button
                onClick={handleExport}
                disabled={!selectedBundle || exporting}
                className="w-full"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export Bundle
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Format Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium">PDF</p>
                    <p className="text-sm text-muted-foreground">
                      Professional formatted document with branding, ideal for printing or sharing
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">CSV/Excel</p>
                    <p className="text-sm text-muted-foreground">
                      Spreadsheet format compatible with Excel, Google Sheets, etc.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileJson className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium">JSON</p>
                    <p className="text-sm text-muted-foreground">
                      Structured data format for importing into other systems
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedBundle && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const bundle = bundles.find(b => b.id === selectedBundle);
                    if (!bundle) return null;
                    return (
                      <div className="space-y-2">
                        <p className="font-medium">{bundle.title}</p>
                        <p className="text-sm text-muted-foreground">{bundle.description}</p>
                        <Badge variant="secondary">
                          {bundle.resources?.length || 0} resources
                        </Badge>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
