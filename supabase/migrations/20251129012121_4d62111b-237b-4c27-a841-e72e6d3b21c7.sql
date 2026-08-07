-- Create bundle shares table for distributing resource bundles via codes
CREATE TABLE IF NOT EXISTS public.bundle_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES public.resource_bundles(id) ON DELETE CASCADE,
  share_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  max_claims INTEGER,
  current_claims INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT
);

-- Create bundle claims table to track who claimed what
CREATE TABLE IF NOT EXISTS public.bundle_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_share_id UUID NOT NULL REFERENCES public.bundle_shares(id) ON DELETE CASCADE,
  claimed_by UUID NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies for bundle_shares
ALTER TABLE public.bundle_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can create bundle shares"
  ON public.bundle_shares
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.resource_bundles
      WHERE id = bundle_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can view their bundle shares"
  ON public.bundle_shares
  FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.resource_bundles
      WHERE id = bundle_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can update their bundle shares"
  ON public.bundle_shares
  FOR UPDATE
  USING (
    created_by = auth.uid()
  );

CREATE POLICY "Anyone can validate share codes"
  ON public.bundle_shares
  FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_claims IS NULL OR current_claims < max_claims)
  );

-- RLS Policies for bundle_claims
ALTER TABLE public.bundle_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own claims"
  ON public.bundle_claims
  FOR INSERT
  WITH CHECK (auth.uid() = claimed_by);

CREATE POLICY "Users can view their own claims"
  ON public.bundle_claims
  FOR SELECT
  USING (auth.uid() = claimed_by);

CREATE POLICY "Professionals can view claims for their shares"
  ON public.bundle_claims
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bundle_shares bs
      WHERE bs.id = bundle_share_id AND bs.created_by = auth.uid()
    )
  );

-- Function to generate unique bundle share codes
CREATE OR REPLACE FUNCTION public.generate_bundle_share_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
BEGIN
  code := 'BUNDLE-' || upper(substring(md5(random()::text) from 1 for 8));
  RETURN code;
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_bundle_shares_code ON public.bundle_shares(share_code);
CREATE INDEX idx_bundle_shares_bundle_id ON public.bundle_shares(bundle_id);
CREATE INDEX idx_bundle_claims_share_id ON public.bundle_claims(bundle_share_id);
CREATE INDEX idx_bundle_claims_user ON public.bundle_claims(claimed_by);