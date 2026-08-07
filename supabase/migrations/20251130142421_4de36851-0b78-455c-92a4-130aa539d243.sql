-- Create storage bucket for user documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-documents',
  'user-documents',
  false,
  20971520, -- 20MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- RLS policies for user documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix security issues: Set search_path on functions to prevent SQL injection
ALTER FUNCTION public.validate_instructor_code SET search_path = public;
ALTER FUNCTION public.get_organization_seat_usage SET search_path = public;
ALTER FUNCTION public.generate_org_connection_code SET search_path = public;
ALTER FUNCTION public.generate_bundle_share_code SET search_path = public;
ALTER FUNCTION public.has_role SET search_path = public;

-- Add database indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_connections_active ON public.organization_connections(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_org_broadcasts_expires ON public.organization_broadcasts(organization_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category, is_active);
CREATE INDEX IF NOT EXISTS idx_support_threads_org ON public.support_threads(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_thread_messages_thread ON public.thread_messages(thread_id, created_at);

-- Add file_url column to saved_documents if it doesn't exist (make it optional now)
ALTER TABLE public.saved_documents ALTER COLUMN file_url DROP NOT NULL;