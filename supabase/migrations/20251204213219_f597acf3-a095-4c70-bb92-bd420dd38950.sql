-- Create resource passport table for tracking client credentials/verifications
CREATE TABLE public.resource_passports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Passport entries (individual credentials/verifications)
CREATE TABLE public.passport_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id uuid NOT NULL REFERENCES public.resource_passports(id) ON DELETE CASCADE,
  entry_type text NOT NULL DEFAULT 'credential',
  title text NOT NULL,
  issuer text,
  issued_date date,
  expiry_date date,
  status text NOT NULL DEFAULT 'active',
  verification_code text,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Passport share links for professionals
CREATE TABLE public.passport_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id uuid NOT NULL REFERENCES public.resource_passports(id) ON DELETE CASCADE,
  share_code text NOT NULL UNIQUE,
  shared_with_org uuid REFERENCES public.organizations(id),
  shared_with_user uuid,
  access_level text NOT NULL DEFAULT 'view',
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resource_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_shares ENABLE ROW LEVEL SECURITY;

-- Passport policies
CREATE POLICY "Users can manage own passport"
ON public.resource_passports FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Entry policies
CREATE POLICY "Users can manage own passport entries"
ON public.passport_entries FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM resource_passports
    WHERE resource_passports.id = passport_entries.passport_id
    AND resource_passports.user_id = auth.uid()
  )
);

-- Professionals can view shared entries
CREATE POLICY "Professionals can view shared entries"
ON public.passport_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM passport_shares ps
    JOIN resource_passports rp ON rp.id = ps.passport_id
    WHERE ps.passport_id = passport_entries.passport_id
    AND ps.is_active = true
    AND (ps.expires_at IS NULL OR ps.expires_at > now())
    AND (
      ps.shared_with_user = auth.uid()
      OR EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = ps.shared_with_org
        AND om.user_id = auth.uid()
      )
    )
  )
);

-- Share policies
CREATE POLICY "Users can manage own passport shares"
ON public.passport_shares FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM resource_passports
    WHERE resource_passports.id = passport_shares.passport_id
    AND resource_passports.user_id = auth.uid()
  )
);

CREATE POLICY "Professionals can view shares for their org"
ON public.passport_shares FOR SELECT
USING (
  shared_with_user = auth.uid()
  OR EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = passport_shares.shared_with_org
    AND organization_members.user_id = auth.uid()
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_resource_passports_updated_at
  BEFORE UPDATE ON public.resource_passports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_passport_entries_updated_at
  BEFORE UPDATE ON public.passport_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();