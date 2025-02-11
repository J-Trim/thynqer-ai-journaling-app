
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting transformation request...');
    
    const { text, transformationType } = await req.json();
    
    console.log('Received request with:', {
      hasText: !!text,
      transformationType
    });

    if (!text?.trim()) {
      console.error('Missing text in request');
      throw new Error('Text is required');
    }

    if (!transformationType) {
      console.error('Missing transformation type');
      throw new Error('Transformation type is required');
    }

    const deepSeekKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepSeekKey) {
      console.error('DEEPSEEK_API_KEY not configured');
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate hash for caching
    const textEncoder = new TextEncoder();
    const hashData = textEncoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', hashData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Check cache
    const { data: cacheHit } = await supabase
      .from('summary_cache')
      .select('cached_result')
      .eq('input_hash', inputHash)
      .eq('transformation_type', transformationType)
      .single();

    if (cacheHit?.cached_result) {
      console.log('Cache hit found, returning cached result');
      return new Response(
        JSON.stringify({ transformedText: cacheHit.cached_result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no cache hit, proceed with transformation
    console.log('No cache hit found, proceeding with DeepSeek transformation');

    // Prepare the prompt based on transformation type
    const getSystemPrompt = (type: string): string => {
      const prompts: Record<string, string> = {
        'Quick Summary': 'Provide a concise summary of the main points.',
        'Emotional Analysis': 'Analyze the emotional tone and key feelings expressed.',
        'Key Insights': 'Extract the most important insights and learnings.',
        'Action Items': 'List specific action items or next steps mentioned.',
        'Questions': 'Generate thoughtful follow-up questions based on the content.'
      };
      return prompts[type] || 'Transform this text while maintaining its core meaning and intent.';
    };

    const enhancedPrompt = `
      You are a thoughtful AI assistant analyzing journal entries.
      
      INSTRUCTIONS:
      ${getSystemPrompt(transformationType)}
      
      TEXT TO ANALYZE:
      ${text}
      
      Please provide:
      1. A clear analysis based on the instruction type
      2. Keep your response focused and concise
      3. Maintain a supportive and constructive tone
    `;
    
    // Call DeepSeek API
    const deepSeekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepSeekKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that transforms text based on specific instructions.'
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!deepSeekResponse.ok) {
      const error = await deepSeekResponse.text();
      console.error('DeepSeek API error:', error);
      throw new Error(`DeepSeek API error: ${error}`);
    }

    const data = await deepSeekResponse.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from DeepSeek');
    }

    const transformedText = data.choices[0].message.content;
    
    // Cache the result
    const { error: cacheError } = await supabase
      .from('summary_cache')
      .insert({
        input_hash: inputHash,
        transformation_type: transformationType,
        input_text: text,
        cached_result: transformedText,
        prompt_template: getSystemPrompt(transformationType)
      });

    if (cacheError) {
      console.error('Error caching result:', cacheError);
    }

    console.log('Successfully transformed text, length:', transformedText.length);

    return new Response(
      JSON.stringify({ transformedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in transform-text function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
