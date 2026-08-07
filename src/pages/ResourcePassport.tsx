import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  Plus,
  Trash2,
  Share2,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Award,
  CreditCard,
  Building2,
  Loader2,
  Link2,
  X
} from 'lucide-react';
import { useUserMode } from '@/hooks/useUserMode';
import { useResourcePassport, PassportEntry } from '@/hooks/useResourcePassport';
import { format, isPast, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const ENTRY_TYPES = [
  { value: 'credential', label: 'Credential', icon: Award },
  { value: 'id', label: 'ID Document', icon: CreditCard },
  { value: 'certification', label: 'Certification', icon: FileText },
  { value: 'verification', label: 'Verification', icon: CheckCircle2 },
  { value: 'membership', label: 'Membership', icon: Building2 }
];

export default function ResourcePassport() {
  const navigate = useNavigate();
  const { user, profile, loading: userLoading } = useUserMode();
  const { passport, loading, addEntry, deleteEntry, createShare, revokeShare } = useResourcePassport(user?.id || null);
  const { toast } = useToast();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    entry_type: 'credential',
    title: '',
    issuer: '',
    issued_date: '',
    expiry_date: '',
    verification_code: '',
    notes: ''
  });
  const [shareExpiry, setShareExpiry] = useState('30');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddEntry = async () => {
    if (!newEntry.title.trim()) return;

    setIsSubmitting(true);
    const success = await addEntry({
      entry_type: newEntry.entry_type,
      title: newEntry.title,
      issuer: newEntry.issuer || null,
      issued_date: newEntry.issued_date || null,
      expiry_date: newEntry.expiry_date || null,
      status: 'active',
      verification_code: newEntry.verification_code || null,
      notes: newEntry.notes || null,
      metadata: {}
    });

    if (success) {
      setNewEntry({
        entry_type: 'credential',
        title: '',
        issuer: '',
        issued_date: '',
        expiry_date: '',
        verification_code: '',
        notes: ''
      });
      setIsAddDialogOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleCreateShare = async () => {
    setIsSubmitting(true);
    const days = shareExpiry === 'never' ? undefined : parseInt(shareExpiry);
    const code = await createShare(undefined, days);
    if (code) {
      navigator.clipboard.writeText(code);
      toast({ title: 'Code copied!', description: 'Share code copied to clipboard' });
    }
    setIsSubmitting(false);
    setIsShareDialogOpen(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!', description: 'Share code copied to clipboard' });
  };

  const getEntryIcon = (type: string) => {
    const found = ENTRY_TYPES.find(t => t.value === type);
    return found ? found.icon : FileText;
  };

  const getStatusBadge = (entry: PassportEntry) => {
    if (entry.expiry_date && isPast(parseISO(entry.expiry_date))) {
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Expired</Badge>;
    }
    if (entry.status === 'active') {
      return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle2 className="h-3 w-3" />Active</Badge>;
    }
    return <Badge variant="secondary">{entry.status}</Badge>;
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onChatClick={() => setIsChatOpen(true)} onSearchClick={() => navigate('/resources')} />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Resource Passport</h1>
              <p className="text-muted-foreground">
                Your portable credentials and verification history
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="credentials" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="credentials">My Credentials</TabsTrigger>
            <TabsTrigger value="sharing">Sharing</TabsTrigger>
          </TabsList>

          {/* Credentials Tab */}
          <TabsContent value="credentials" className="space-y-4">
            {/* Add Entry Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Credential
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Credential</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={newEntry.entry_type}
                      onValueChange={(value) => setNewEntry(prev => ({ ...prev, entry_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ENTRY_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Title *</label>
                    <Input
                      value={newEntry.title}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., SNAP Benefits Approved"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Issuer</label>
                    <Input
                      value={newEntry.issuer}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, issuer: e.target.value }))}
                      placeholder="e.g., Department of Social Services"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Issue Date</label>
                      <Input
                        type="date"
                        value={newEntry.issued_date}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, issued_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Expiry Date</label>
                      <Input
                        type="date"
                        value={newEntry.expiry_date}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, expiry_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Verification/Reference Code</label>
                    <Input
                      value={newEntry.verification_code}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, verification_code: e.target.value }))}
                      placeholder="Optional reference number"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea
                      value={newEntry.notes}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional details..."
                      rows={2}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleAddEntry}
                    disabled={!newEntry.title.trim() || isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    Add to Passport
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Entries List */}
            {passport?.entries.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No credentials yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your credentials, verifications, and important documents
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {passport?.entries.map((entry) => {
                  const Icon = getEntryIcon(entry.entry_type);
                  return (
                    <Card key={entry.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{entry.title}</h3>
                              {getStatusBadge(entry)}
                            </div>
                            {entry.issuer && (
                              <p className="text-sm text-muted-foreground">
                                Issued by: {entry.issuer}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                              {entry.issued_date && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Issued: {format(parseISO(entry.issued_date), 'MMM d, yyyy')}
                                </span>
                              )}
                              {entry.expiry_date && (
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Expires: {format(parseISO(entry.expiry_date), 'MMM d, yyyy')}
                                </span>
                              )}
                            </div>
                            {entry.verification_code && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Ref: {entry.verification_code}
                              </p>
                            )}
                            {entry.notes && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEntry(entry.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Sharing Tab */}
          <TabsContent value="sharing" className="space-y-4">
            {/* Create Share Dialog */}
            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Create Share Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Your Passport</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Create a code to share your credentials with service providers.
                  </p>

                  <div>
                    <label className="text-sm font-medium">Expires After</label>
                    <Select value={shareExpiry} onValueChange={setShareExpiry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleCreateShare}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
                    Generate Share Code
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Active Shares */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Shares</CardTitle>
                <CardDescription>
                  People and organizations with access to your passport
                </CardDescription>
              </CardHeader>
              <CardContent>
                {passport?.shares.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active shares</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {passport?.shares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {share.share_code}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyCode(share.share_code)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {share.expires_at
                              ? `Expires: ${format(parseISO(share.expires_at), 'MMM d, yyyy')}`
                              : 'Never expires'
                            }
                            {share.org_name && ` • Shared with: ${share.org_name}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeShare(share.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
