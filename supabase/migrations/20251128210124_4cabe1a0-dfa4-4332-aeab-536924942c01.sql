-- Create organization verification requests table
CREATE TABLE public.organization_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  organization_email TEXT NOT NULL,
  organization_domain TEXT,
  organization_type TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  description TEXT NOT NULL,
  tax_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable RLS
ALTER TABLE public.organization_verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
ON public.organization_verification_requests
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create requests"
ON public.organization_verification_requests
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON public.organization_verification_requests
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all requests
CREATE POLICY "Admins can update requests"
ON public.organization_verification_requests
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_org_verification_requests_updated_at
BEFORE UPDATE ON public.organization_verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();