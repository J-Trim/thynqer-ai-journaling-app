
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { journalEntry } = await req.json();
    
    if (!journalEntry) {
      return new Response(
        JSON.stringify({ error: 'Missing journal entry' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const deepSeekKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepSeekKey) {
      return new Response(
        JSON.stringify({ error: 'DEEPSEEK_API_KEY not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepSeekKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{
          role: 'system',
          content: 'You are a thoughtful and empathetic AI therapist. Analyze journal entries and provide therapeutic insights.'
        }, {
          role: 'user',
          content: `
            Analyze this journal entry and provide therapy-style insights:
            1. Identify the key emotions present in the text
            2. Detect and explain any cognitive distortions (e.g., overgeneralization, black-and-white thinking)
            3. Offer a supportive reflection, as a therapist would
            4. Provide one actionable self-improvement suggestion

            Journal Entry:
            ${journalEntry}
          `
        }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', errorText);
      throw new Error('Failed to get insights from DeepSeek');
    }

    const result = await response.json();
    const insight = result.choices[0].message.content;

    return new Response(
      JSON.stringify({ insight }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-entry function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

