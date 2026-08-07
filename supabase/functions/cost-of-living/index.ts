import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CostCategory {
  name: string;
  icon: string;
  value: number;
  description: string;
}

// Simulated cost of living data
// In a real implementation, this would call an external API
const generateCostData = (location: string) => {
  // Generate somewhat realistic data based on location
  const seed = location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number) => {
    const x = Math.sin(seed + min) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };

  const categories: CostCategory[] = [
    {
      name: "Housing",
      icon: "🏠",
      value: random(-0.6, 0.8),
      description: "Average rent and basic housing costs"
    },
    {
      name: "Food & Groceries",
      icon: "🛒",
      value: random(-0.4, 0.6),
      description: "Typical grocery and basic meal costs"
    },
    {
      name: "Transportation",
      icon: "🚗",
      value: random(-0.5, 0.5),
      description: "Gas, public transit, and travel costs"
    },
    {
      name: "Utilities",
      icon: "💡",
      value: random(-0.3, 0.4),
      description: "Electricity, water, heating, internet"
    },
    {
      name: "Healthcare",
      icon: "🏥",
      value: random(-0.4, 0.7),
      description: "Basic medical care and pharmacy costs"
    },
    {
      name: "Other Basics",
      icon: "🛍️",
      value: random(-0.3, 0.5),
      description: "Personal care and miscellaneous needs"
    }
  ];

  const overallIndex = categories.reduce((sum, cat) => sum + cat.value, 0) / categories.length;

  return {
    categories,
    overallIndex,
    location
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location } = await req.json();

    if (!location) {
      return new Response(
        JSON.stringify({ error: "Location is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Generate cost data
    const costData = generateCostData(location);

    return new Response(
      JSON.stringify(costData),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in cost-of-living function:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch cost of living data",
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
