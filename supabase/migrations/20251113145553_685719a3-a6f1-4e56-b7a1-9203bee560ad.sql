-- Create resources table for storing community services
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT,
  phone TEXT NOT NULL,
  hours TEXT NOT NULL,
  website TEXT,
  eligibility TEXT NOT NULL,
  cost TEXT NOT NULL,
  languages TEXT[] DEFAULT ARRAY['English']::TEXT[],
  accessibility TEXT,
  transportation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  verified_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view resources)
CREATE POLICY "Resources are viewable by everyone"
  ON public.resources
  FOR SELECT
  USING (is_active = true);

-- Create index for category searches
CREATE INDEX idx_resources_category ON public.resources(category);
CREATE INDEX idx_resources_active ON public.resources(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();