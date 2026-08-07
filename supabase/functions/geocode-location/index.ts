import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, state } = await req.json();

    if (!city || !state) {
      return new Response(
        JSON.stringify({ error: 'City and state are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Geocoding location:', city, state);

    // Use Nominatim (OpenStreetMap) geocoding API - free and no API key required
    const query = `${city}, ${state}, USA`;
    const encodedQuery = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&countrycodes=us`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BridgePoint App (contact: support@bridgepoint.app)' // Required by Nominatim
      }
    });

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const results = await response.json();

    if (!results || results.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Location not found. Please check the city and state spelling.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const location = results[0];
    const coordinates = {
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
      displayName: location.display_name
    };

    console.log('Geocoded successfully:', coordinates);

    return new Response(
      JSON.stringify(coordinates),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in geocode-location:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to geocode location' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
