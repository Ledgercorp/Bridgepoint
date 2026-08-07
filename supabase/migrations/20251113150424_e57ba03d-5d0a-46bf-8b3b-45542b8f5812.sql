-- Add location coordinates to resources table
ALTER TABLE public.resources
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION;

-- Update existing resources with sample coordinates (Downtown area)
UPDATE public.resources SET
  latitude = CASE
    WHEN name = 'Community Food Bank Network' THEN 40.7589
    WHEN name = 'Safe Haven Shelter' THEN 40.7612
    WHEN name = 'Legal Aid Community Services' THEN 40.7598
    WHEN name = 'Hope Transit Services' THEN 40.7605
    WHEN name = 'Domestic Violence Crisis Center' THEN 40.7580
    WHEN name = 'Youth Futures Program' THEN 40.7621
    WHEN name = '24/7 Community Crisis Hotline' THEN NULL
    WHEN name = 'Emergency Financial Assistance Fund' THEN 40.7595
  END,
  longitude = CASE
    WHEN name = 'Community Food Bank Network' THEN -73.9851
    WHEN name = 'Safe Haven Shelter' THEN -73.9877
    WHEN name = 'Legal Aid Community Services' THEN -73.9845
    WHEN name = 'Hope Transit Services' THEN -73.9862
    WHEN name = 'Domestic Violence Crisis Center' THEN NULL
    WHEN name = 'Youth Futures Program' THEN -73.9890
    WHEN name = '24/7 Community Crisis Hotline' THEN NULL
    WHEN name = 'Emergency Financial Assistance Fund' THEN -73.9868
  END;