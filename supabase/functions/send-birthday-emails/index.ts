import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('Authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get current month (1-12)
    const currentMonth = new Date().getMonth() + 1;
    console.log(`[SendBirthdayEmails] Checking for users with birth month: ${currentMonth}`);

    // Query profiles with matching birth month
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('birth_month', currentMonth);

    if (fetchError) throw fetchError;

    console.log(`[SendBirthdayEmails] Found ${profiles?.length || 0} users with birthdays this month.`);

    let successCount = 0;
    let errorCount = 0;

    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        try {
          const emailRes = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'birthday_month',
              data: {
                email: profile.email,
                name: profile.name
              }
            })
          });

          if (emailRes.ok) {
            successCount++;
          } else {
            console.error(`[SendBirthdayEmails] Failed to send email to ${profile.email}:`, await emailRes.text());
            errorCount++;
          }
        } catch (err) {
          console.error(`[SendBirthdayEmails] Error sending to ${profile.email}:`, err);
          errorCount++;
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Processed birthdays for month ${currentMonth}. Sent: ${successCount}, Failed: ${errorCount}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[SendBirthdayEmails] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
