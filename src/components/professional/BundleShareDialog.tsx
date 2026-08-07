import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, QrCode as QrCodeIcon, FileDown } from "lucide-react";
import QRCode from "qrcode";
import jsPDF from "jspdf";

interface BundleShareDialogProps {
  open: boolean;
  onClose: () => void;
  bundleId: string;
  bundleTitle: string;
  bundleDescription: string | null;
  bundleResources: Array<{
    name: string;
    address?: string;
    phone?: string;
    website?: string;
    hours?: string;
  }>;
  bundleNotes: string | null;
}

export function BundleShareDialog({
  open,
  onClose,
  bundleId,
  bundleTitle,
  bundleDescription,
  bundleResources,
  bundleNotes
}: BundleShareDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const shareUrl = `${window.location.origin}/bundle/${bundleId}`;

  useEffect(() => {
    if (open) {
      generateQRCode();
    }
  }, [open, bundleId]);

  const generateQRCode = async () => {
    try {
      const url = await QRCode.toDataURL(shareUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        }
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link Copied",
      description: "Share link copied to clipboard"
    });
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `${bundleTitle.replace(/[^a-z0-9]/gi, '_')}_QR.png`;
    link.href = qrCodeUrl;
    link.click();

    toast({
      title: "QR Code Downloaded",
      description: "QR code image has been downloaded"
    });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.text(bundleTitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Description
    if (bundleDescription) {
      doc.setFontSize(12);
      doc.setTextColor(100);
      const descLines = doc.splitTextToSize(bundleDescription, pageWidth - 40);
      doc.text(descLines, 20, yPosition);
      yPosition += (descLines.length * 7) + 10;
    }

    // Resources
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Resources', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    bundleResources.forEach((resource, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`${index + 1}. ${resource.name}`, 20, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setTextColor(100);

      if (resource.address) {
        doc.text(`   Address: ${resource.address}`, 20, yPosition);
        yPosition += 6;
      }
      if (resource.phone) {
        doc.text(`   Phone: ${resource.phone}`, 20, yPosition);
        yPosition += 6;
      }
      if (resource.website) {
        doc.text(`   Website: ${resource.website}`, 20, yPosition);
        yPosition += 6;
      }
      if (resource.hours) {
        doc.text(`   Hours: ${resource.hours}`, 20, yPosition);
        yPosition += 6;
      }
      yPosition += 5;
    });

    // Notes
    if (bundleNotes) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text('Notes', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setTextColor(100);
      const notesLines = doc.splitTextToSize(bundleNotes, pageWidth - 40);
      doc.text(notesLines, 20, yPosition);
    }

    // Save
    doc.save(`${bundleTitle.replace(/[^a-z0-9]/gi, '_')}_Bundle.pdf`);

    toast({
      title: "PDF Exported",
      description: "Resource bundle has been exported as PDF"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Resource Bundle</DialogTitle>
          <DialogDescription>
            Choose how you want to share this bundle
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="pdf">PDF</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly />
                <Button onClick={handleCopyLink} size="icon">
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can view the resource bundle
              </p>
            </div>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              {qrCodeUrl && (
                <>
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="border-2 border-border rounded-lg p-4"
                  />
                  <Button onClick={handleDownloadQR} className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Download QR Code
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Print or display this QR code for easy access
                  </p>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pdf" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Export this bundle as a PDF document including:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Bundle title and description</li>
                  <li>• All {bundleResources.length} resources with details</li>
                  {bundleNotes && <li>• Professional notes</li>}
                </ul>
              </div>
              <Button onClick={handleExportPDF} className="w-full gap-2">
                <FileDown className="h-4 w-4" />
                Export as PDF
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
