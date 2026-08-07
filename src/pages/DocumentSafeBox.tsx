import { useState, useEffect } from "react";
import { ArrowLeft, Upload, FileText, Trash2, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserMode } from "@/hooks/useUserMode";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Document {
  id: string;
  document_name: string;
  document_type: string | null;
  file_url: string;
  tags: string[] | null;
  created_at: string;
}

export default function DocumentSafeBox() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserMode();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("saved_documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsLoading(true);
    try {
      // Validate file size (20MB limit)
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File must be smaller than 20MB.",
          variant: "destructive",
        });
        return;
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('saved_documents')
        .insert({
          user_id: user.id,
          document_name: file.name,
          document_type: "General",
          file_url: uploadData.path,
          tags: ["Uploaded"],
        });

      if (dbError) {
        // Rollback: delete uploaded file if database insert fails
        await supabase.storage.from('user-documents').remove([fileName]);
        throw dbError;
      }

      toast({
        title: "Document Saved",
        description: "Your document has been securely stored.",
      });

      fetchDocuments();

      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save document.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    try {
      // Delete file from storage if it exists
      if (filePath && filePath !== 'placeholder-url') {
        const { error: storageError } = await supabase.storage
          .from('user-documents')
          .remove([filePath]);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
        }
      }

      // Delete metadata from database
      const { error } = await supabase
        .from("saved_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Document Deleted",
        description: "Document has been removed from your safe box.",
      });

      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete document.",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Document Safe Box</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Alert>
            <AlertDescription>
              Please sign in to use the Document Safe Box.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Document Safe Box</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Secure Documents</CardTitle>
            <CardDescription>
              Store photos and PDFs of important documents like IDs, insurance cards,
              proof of residence, and more. Your documents are private and secure.
            </CardDescription>
          </CardHeader>
        </Card>

        <Alert className="mb-6">
          <AlertDescription>
            <strong>Privacy:</strong> Your documents are encrypted and only accessible to you.
            Never upload documents containing sensitive client information.
          </AlertDescription>
        </Alert>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload a document (PDF, JPG, or PNG)
              </p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
                id="doc-upload"
                disabled={isLoading}
              />
              <label htmlFor="doc-upload">
                <Button asChild disabled={isLoading}>
                  <span>{isLoading ? "Uploading..." : "Choose File"}</span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Saved Documents</h2>
          {documents.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No documents saved yet. Upload your first document above.
              </CardContent>
            </Card>
          ) : (
            documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <FileText className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{doc.document_name}</h3>
                        {doc.document_type && (
                          <p className="text-sm text-muted-foreground">{doc.document_type}</p>
                        )}
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {doc.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs"
                              >
                                <Tag className="h-3 w-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Added {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc.id, doc.file_url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
