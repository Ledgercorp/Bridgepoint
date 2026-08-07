-- Add resource freshness and reporting fields
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS report_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reported_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_check_status TEXT DEFAULT 'pending';

-- Create resource_reports table to track individual reports (without user info)
CREATE TABLE IF NOT EXISTS public.resource_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on resource_reports
ALTER TABLE public.resource_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit reports (no authentication required for privacy)
CREATE POLICY "Anyone can submit resource reports"
ON public.resource_reports
FOR INSERT
WITH CHECK (true);

-- Only allow reading reports (for admin purposes later)
CREATE POLICY "Reports are readable by everyone"
ON public.resource_reports
FOR SELECT
USING (true);

-- Create index for resource reports
CREATE INDEX IF NOT EXISTS idx_resource_reports_resource_id ON public.resource_reports(resource_id);
CREATE INDEX IF NOT EXISTS idx_resources_needs_review ON public.resources(needs_review) WHERE needs_review = true;
CREATE INDEX IF NOT EXISTS idx_resources_last_checked ON public.resources(last_checked_at);