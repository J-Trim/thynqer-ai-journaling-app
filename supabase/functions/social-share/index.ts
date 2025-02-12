
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    
    if (!journalEntry?.trim()) {
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

    console.log('Processing journal entry for social sharing...');

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepSeekKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{
          role: 'system',
          content: 'You are a professional social media content creator who excels at transforming personal journal entries into engaging social media posts while maintaining privacy and professionalism.'
        }, {
          role: 'user',
          content: `
            Convert this journal entry into shareable content while maintaining privacy and removing any personal identifiers:

            1. Create a Tweet (280 characters max) that captures a key insight or reflection
            2. Write an Instagram caption (2-3 engaging sentences with relevant hashtags)
            3. Craft a LinkedIn post (professional reflection, max 600 words)

            Make each platform-specific post inspirational and relatable while maintaining the core message.
            
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
      throw new Error('Failed to generate social media content');
    }

    const result = await response.json();
    const content = result.choices[0].message.content;

    console.log('Successfully generated social media content');

    return new Response(
      JSON.stringify({ shareableContent: content }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in social-share function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
