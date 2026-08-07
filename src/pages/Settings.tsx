import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUserMode } from "@/hooks/useUserMode";
import { MapPin, Palette, Type, Bell, Shield, Info, GraduationCap, Volume2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StudentVerificationDialog as UpgradeToStudentDialog } from "@/components/UpgradeToStudentDialog";
import bridgepointLogo from "@/assets/bridgepoint-logo.png";
import { ModeSwitcher } from "@/components/ModeSwitcher";

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, currentMode, isEduVerified, isProfessionalVerified, isInstructorVerified, isAdmin, updateMode, updateProfile, loading } = useUserMode();

  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState("medium");
  const [firstName, setFirstName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [solaceTone, setSolaceTone] = useState("balanced");
  const [culturalHumility, setCulturalHumility] = useState(true);
  const [audioReadEnabled, setAudioReadEnabled] = useState(true);
  const [voiceInputEnabled, setVoiceInputEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  // Sync audio-read setting to localStorage
  useEffect(() => {
    localStorage.setItem("audioReadEnabled", String(audioReadEnabled));
  }, [audioReadEnabled]);

  // Sync voice input setting to localStorage
  useEffect(() => {
    localStorage.setItem("voiceInputEnabled", String(voiceInputEnabled));
  }, [voiceInputEnabled]);

  // Apply theme and font size to document
  useEffect(() => {
    const html = document.documentElement;

    // Apply theme
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    // Apply font size
    html.classList.remove("text-small", "text-medium", "text-large", "text-xlarge");
    html.classList.add(`text-${fontSize}`);
  }, [theme, fontSize]);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/auth");
      return;
    }

    if (profile) {
      setFirstName(profile.first_name || "");
      setTheme(profile.preferences?.theme || "light");
      setFontSize(profile.preferences?.fontSize || "medium");
      setZipCode(profile.preferences?.zipCode || "");
      setSolaceTone(profile.preferences?.solaceTone || "balanced");
      setCulturalHumility(profile.preferences?.culturalHumility !== false);
      setAudioReadEnabled(profile.preferences?.audioReadEnabled !== false);
      setVoiceInputEnabled(profile.preferences?.voiceInputEnabled !== false);
      setRemindersEnabled(profile.preferences?.remindersEnabled === true);
    }
  }, [user, profile, loading, navigate]);

  const handleSave = async () => {
    setSaving(true);

    const success = await updateProfile({
      first_name: firstName || null,
      preferences: {
        theme,
        fontSize,
        zipCode: zipCode || null,
        solaceTone,
        culturalHumility,
        audioReadEnabled,
        voiceInputEnabled,
        remindersEnabled,
      },
    });

    if (success) {
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    }

    setSaving(false);
  };

  const handleClearCache = () => {
    localStorage.clear();
    toast({
      title: "Cache Cleared",
      description: "Cached data has been removed from this device.",
    });
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header onChatClick={() => {}} onSearchClick={() => {}} />
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => {}} onSearchClick={() => {}} />

      <div className="container max-w-2xl py-8 px-4 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage how BridgePoint works for you
          </p>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>Personal information for greetings and location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name (Optional)</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Used for personalized greetings like "Hi, {firstName || 'Your Name'}"
              </p>
            </div>

            <div className="space-y-2">
              <Label>Home Location</Label>
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {profile?.home_location || "Not set"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                To change your location, use the "Change" button on the home screen
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mode Switcher */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <CardTitle>Mode</CardTitle>
            </div>
            <CardDescription>
              Switch between Community, Student, and Professional modes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Mode</Label>
              <div className="flex items-center gap-3">
                <ModeSwitcher
                  currentMode={currentMode}
                  isEduVerified={isEduVerified}
                  isProfessionalVerified={isProfessionalVerified}
                  isInstructorVerified={isInstructorVerified}
                  isAdmin={isAdmin}
                  onModeChange={updateMode}
                  variant="button"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isEduVerified || isProfessionalVerified
                  ? "You can switch between available modes at any time"
                  : "Verify your .edu email to access Student Mode"}
              </p>
            </div>

            {!isEduVerified && currentMode === "community" && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm font-medium">Verify Student Email</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Access Student Mode by verifying your .edu email address for educational tools and features.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUpgradeDialogOpen(true)}
                  className="mt-2"
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Verify .edu Email
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize how BridgePoint looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="high-contrast">High Contrast</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontSize">Font Size</Label>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger id="fontSize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="xlarge">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Accessibility */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              <CardTitle>Accessibility</CardTitle>
            </div>
            <CardDescription>Audio and reading assistance features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="audioReadEnabled">Enable Audio-Read Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Show "Listen" buttons to read text aloud throughout the app
                </p>
              </div>
              <Switch
                id="audioReadEnabled"
                checked={audioReadEnabled}
                onCheckedChange={setAudioReadEnabled}
              />
            </div>

            <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
              Audio-Read helps users with low literacy or neurodivergent needs by reading
              text aloud. All processing is done in your browser—nothing is recorded or stored.
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="voiceInputEnabled">Enable Voice Input</Label>
                <p className="text-sm text-muted-foreground">
                  Show microphone button to speak instead of typing
                </p>
              </div>
              <Switch
                id="voiceInputEnabled"
                checked={voiceInputEnabled}
                onCheckedChange={setVoiceInputEnabled}
              />
            </div>

            <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
              Voice Input converts your speech to text using your device's microphone.
              Audio is sent securely for transcription and is never stored.
            </div>
          </CardContent>
        </Card>

        {/* Task Reminders */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <CardTitle>Task Reminders</CardTitle>
            </div>
            <CardDescription>Gentle, non-pressuring reminders for saved tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="remindersEnabled">Allow gentle reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get supportive reminders for tasks you've saved
                </p>
              </div>
              <Switch
                id="remindersEnabled"
                checked={remindersEnabled}
                onCheckedChange={setRemindersEnabled}
              />
            </div>

            <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
              Reminders are calm and non-guilting. No streaks, gamification, or pressure.
              Just gentle nudges when you're ready.
            </div>
          </CardContent>
        </Card>

        {/* Location & Search */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <CardTitle>Location & Search</CardTitle>
            </div>
            <CardDescription>Set your default search area</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode">Home ZIP Code</Label>
              <Input
                id="zipCode"
                type="text"
                placeholder="Enter ZIP code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                maxLength={5}
              />
              <p className="text-xs text-muted-foreground">
                Location is only used for distance calculations and is not stored as personal data.
              </p>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium">Location Permission Status</p>
              <p className="text-xs text-muted-foreground mt-1">
                To enable GPS-based searches, allow location access in your device settings.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Solace Behavior (Student Mode Only) */}
        {isEduVerified && currentMode === "student" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                <CardTitle>Solace Settings</CardTitle>
              </div>
              <CardDescription>Customize how your guide responds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="solaceTone">Response Tone</Label>
                <Select value={solaceTone} onValueChange={setSolaceTone}>
                  <SelectTrigger id="solaceTone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="softer">Softer & Supportive</SelectItem>
                    <SelectItem value="balanced">Balanced & Clear</SelectItem>
                    <SelectItem value="concise">Concise & Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="culturalHumility">Cultural Humility Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Enhanced awareness of diverse backgrounds
                  </p>
                </div>
                <Switch
                  id="culturalHumility"
                  checked={culturalHumility}
                  onCheckedChange={setCulturalHumility}
                />
              </div>

              <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                Solace provides general, non-clinical information only.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Privacy & Safety */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <CardTitle>Privacy & Safety</CardTitle>
            </div>
            <CardDescription>Manage your data and privacy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              onClick={handleClearCache}
              className="w-full"
            >
              Clear Cached Data
            </Button>
            <p className="text-xs text-muted-foreground">
              This clears temporary data stored on your device. It does not delete your account.
            </p>

            <div className="p-4 bg-warm/10 border border-warm/30 rounded-lg">
              <p className="font-medium text-sm">Safety Reminder</p>
              <p className="text-sm text-muted-foreground mt-1">
                BridgePoint does not store client or identifying information.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* About BridgePoint */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              <CardTitle>About BridgePoint</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center py-4">
              <img
                src={bridgepointLogo}
                alt="BridgePoint"
                className="h-20 w-auto"
              />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                An ethical AI-powered community resource navigator helping students and community members
                discover local support and learn real-world navigation skills.
              </p>
            </div>
            <div className="space-y-2 text-sm pt-4 border-t">
              <div className="flex justify-between">
                <span className="text-muted-foreground">App Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Build</span>
                <span className="font-medium">2025.01</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-2">
          <Button onClick={() => navigate(-1)} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <UpgradeToStudentDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
      />
    </div>
  );
}
