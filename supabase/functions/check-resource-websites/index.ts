import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Resource {
  id: string;
  name: string;
  website: string | null;
  last_checked_at: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting website freshness check...');

    // Fetch resources that have websites and haven't been checked recently
    // Check resources that haven't been checked in the last 7 days or never checked
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: resources, error: fetchError } = await supabase
      .from('resources')
      .select('id, name, website, last_checked_at')
      .eq('is_active', true)
      .not('website', 'is', null)
      .or(`last_checked_at.is.null,last_checked_at.lt.${sevenDaysAgo.toISOString()}`);

    if (fetchError) {
      console.error('Error fetching resources:', fetchError);
      throw fetchError;
    }

    if (!resources || resources.length === 0) {
      console.log('No resources need checking at this time');
      return new Response(
        JSON.stringify({ message: 'No resources to check', checked: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Checking ${resources.length} resource websites...`);

    let successCount = 0;
    let failCount = 0;
    let errorCount = 0;

    // Check each website with a reasonable timeout
    for (const resource of resources) {
      try {
        console.log(`Checking ${resource.name} - ${resource.website}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(resource.website!, {
          method: 'HEAD', // Use HEAD to avoid downloading full content
          signal: controller.signal,
          redirect: 'follow',
        });

        clearTimeout(timeoutId);

        const status = response.status >= 200 && response.status < 400 ? 'ok' : 'failed';

        if (status === 'ok') {
          successCount++;
        } else {
          failCount++;
        }

        // Update the resource with check results
        await supabase
          .from('resources')
          .update({
            last_checked_at: new Date().toISOString(),
            last_check_status: status,
          })
          .eq('id', resource.id);

        console.log(`✓ ${resource.name}: ${status} (HTTP ${response.status})`);
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`✗ ${resource.name}: Error - ${errorMessage}`);

        // Mark as failed if we can't reach it
        await supabase
          .from('resources')
          .update({
            last_checked_at: new Date().toISOString(),
            last_check_status: 'failed',
          })
          .eq('id', resource.id);
      }
    }

    const result = {
      message: 'Website check completed',
      total: resources.length,
      success: successCount,
      failed: failCount,
      errors: errorCount,
    };

    console.log('Check complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fatal error in check-resource-websites:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});