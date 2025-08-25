import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const { visitor_id, action } = body;
      if (!visitor_id || !action || !['add','remove'].includes(action)) {
        return json({ error: 'Invalid payload', required: ['visitor_id','action(add|remove)'] }, 400);
      }

      if (action === 'add') {
        const { error } = await supabase.from('blacklist').insert({ visitor_id });
        if (error) return json({ error: 'Insert failed', details: error.message }, 500);
        return json({ success: true, status: 'added', visitor_id });
      } else {
        const { error } = await supabase.from('blacklist').delete().eq('visitor_id', visitor_id);
        if (error) return json({ error: 'Delete failed', details: error.message }, 500);
        return json({ success: true, status: 'removed', visitor_id });
      }
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const vid = url.searchParams.get('visitor_id');
      if (!vid) return json({ error: 'visitor_id required' }, 400);
      const { data, error } = await supabase.from('blacklist').select('visitor_id').eq('visitor_id', vid).maybeSingle();
      if (error && error.code !== 'PGRST116') return json({ error: 'Query failed', details: error.message }, 500);
      return json({ blacklisted: !!data, visitor_id: vid });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (e: any) {
    return json({ error: 'Internal error', message: e.message }, 500);
  }
});

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
