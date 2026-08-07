import { useState } from "react";
import { MapPin, Phone, Clock, ExternalLink, Navigation, AlertTriangle, CheckCircle2, Flag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReportResourceDialog } from "@/components/ReportResourceDialog";

interface ResourceCardProps {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  phone: string;
  hours: string;
  website?: string;
  eligibility: string;
  cost: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
  needsReview?: boolean;
  lastCheckedAt?: string | null;
  lastCheckStatus?: string | null;
}

export const ResourceCard = ({
  id,
  name,
  category,
  description,
  address,
  phone,
  hours,
  website,
  eligibility,
  cost,
  distance,
  latitude,
  longitude,
  needsReview,
  lastCheckedAt,
  lastCheckStatus,
}: ResourceCardProps) => {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const openInMaps = () => {
    if (latitude && longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      window.open(url, '_blank');
    }
  };

  // Calculate freshness status
  const getFreshnessStatus = () => {
    if (needsReview) {
      return { type: "warning", message: "⚠️ May be outdated – please call to confirm" };
    }

    if (!lastCheckedAt) {
      return { type: "pending", message: "Verification pending" };
    }

    const lastChecked = new Date(lastCheckedAt);
    const daysSinceCheck = Math.floor((Date.now() - lastChecked.getTime()) / (1000 * 60 * 60 * 24));

    if (lastCheckStatus === "ok" && daysSinceCheck <= 30) {
      return { type: "success", message: "✅ Verified recently" };
    }

    if (lastCheckStatus === "failed" || daysSinceCheck > 90) {
      return { type: "warning", message: "⚠️ May be outdated – please call to confirm" };
    }

    return { type: "info", message: `Last verified ${daysSinceCheck} days ago` };
  };

  const freshnessStatus = getFreshnessStatus();

  return (
    <>
      <Card className="p-6 hover:shadow-medium transition-shadow duration-300 border border-border">
        <div className="space-y-4">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground">{name}</h3>
                {distance !== undefined && (
                  <div className="flex items-center gap-1 text-sm text-primary mt-1">
                    <Navigation className="w-4 h-4" />
                    <span className="font-medium">{distance.toFixed(1)} miles away</span>
                  </div>
                )}
              </div>
              <Badge variant="secondary" className="ml-2">{category}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          {/* Freshness Indicator */}
          {freshnessStatus.type === "warning" && (
            <Alert variant="default" className="border-warm/30 bg-warm/10">
              <AlertTriangle className="h-4 w-4 text-warm" />
              <AlertDescription className="text-sm">
                {freshnessStatus.message}
              </AlertDescription>
            </Alert>
          )}
          {freshnessStatus.type === "success" && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>{freshnessStatus.message}</span>
            </div>
          )}

        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2 text-foreground">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
            <div className="flex-1">
              <span>{address}</span>
              {latitude && longitude && (
                <button
                  onClick={openInMaps}
                  className="ml-2 text-primary hover:underline text-sm"
                >
                  Open in Maps →
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Phone className="w-4 h-4 flex-shrink-0 text-primary" />
            <a href={`tel:${phone}`} className="hover:underline">{phone}</a>
          </div>
          <div className="flex items-start gap-2 text-foreground">
            <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
            <span>{hours}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-border space-y-2">
          <div>
            <span className="text-sm font-medium text-foreground">Eligibility: </span>
            <span className="text-sm text-muted-foreground">{eligibility}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-foreground">Cost: </span>
            <Badge variant={cost === "Free" ? "default" : "secondary"} className="ml-1">
              {cost}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          {website && (
            <Button variant="outline" className="flex-1 gap-2" asChild>
              <a href={website} target="_blank" rel="noopener noreferrer">
                Visit Website
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setReportDialogOpen(true)}
          >
            <Flag className="w-4 h-4" />
            <span className="hidden sm:inline">Report Issue</span>
          </Button>
        </div>
      </div>
    </Card>

    <ReportResourceDialog
      open={reportDialogOpen}
      onOpenChange={setReportDialogOpen}
      resourceId={id}
      resourceName={name}
    />
    </>
  );
};
