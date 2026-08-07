-- Add organization types and services
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS organization_type text,
ADD COLUMN IF NOT EXISTS services text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zip_code text,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone;

-- Create organization reviews table
CREATE TABLE IF NOT EXISTS public.organization_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  helpful_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create organization photos table
CREATE TABLE IF NOT EXISTS public.organization_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  caption text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Create organization testimonials table
CREATE TABLE IF NOT EXISTS public.organization_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  testimonial_text text NOT NULL,
  author_name text,
  author_role text,
  created_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_reviews_org_id ON public.organization_reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_reviews_user_id ON public.organization_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_org_photos_org_id ON public.organization_photos(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_testimonials_org_id ON public.organization_testimonials(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_city ON public.organizations(city);
CREATE INDEX IF NOT EXISTS idx_organizations_state ON public.organizations(state);
CREATE INDEX IF NOT EXISTS idx_organizations_zip ON public.organizations(zip_code);
CREATE INDEX IF NOT EXISTS idx_organizations_featured ON public.organizations(featured) WHERE featured = true;

-- Enable RLS
ALTER TABLE public.organization_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_testimonials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews"
  ON public.organization_reviews FOR SELECT
  USING (true);

CREATE POLICY "Connected users can create reviews"
  ON public.organization_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.organization_connections
      WHERE organization_id = organization_reviews.organization_id
      AND user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Users can update own reviews"
  ON public.organization_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.organization_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for photos
CREATE POLICY "Anyone can view photos"
  ON public.organization_photos FOR SELECT
  USING (true);

CREATE POLICY "Org admins can manage photos"
  ON public.organization_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organization_photos.organization_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- RLS Policies for testimonials
CREATE POLICY "Anyone can view testimonials"
  ON public.organization_testimonials FOR SELECT
  USING (true);

CREATE POLICY "Org admins can manage testimonials"
  ON public.organization_testimonials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organization_testimonials.organization_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Trigger for updated_at on reviews
CREATE TRIGGER update_organization_reviews_updated_at
  BEFORE UPDATE ON public.organization_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();