
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "./utils/cors.ts";
import { getSystemPrompt, callDeepSeek } from "./services/deepseek.ts";
import { checkCache, saveToCache } from "./services/cache.ts";
import { generateInputHash } from "./utils/hash.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    console.log('Starting transformation request...');
    
    const { text, transformationType, customTemplate } = await req.json();
    
    console.log('Received request with:', {
      hasText: !!text,
      transformationType,
      hasCustomTemplate: !!customTemplate
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

    // Generate hash and check cache
    const inputHash = await generateInputHash(text, customTemplate);
    const cachedResult = await checkCache(supabase, inputHash, transformationType);

    if (cachedResult) {
      console.log('Cache hit found, returning cached result');
      return new Response(
        JSON.stringify({ transformedText: cachedResult }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no cache hit, proceed with transformation
    console.log('No cache hit found, proceeding with DeepSeek transformation');

    const basePrompt = customTemplate || getSystemPrompt(transformationType);
    const enhancedPrompt = `
      You are a thoughtful AI assistant analyzing journal entries.
      
      INSTRUCTIONS:
      ${basePrompt}
      
      Please provide:
      1. A clear summary of the key themes and insights
      2. The overall emotional sentiment (positive, neutral, or negative)
      3. A thoughtful follow-up question to promote deeper reflection
      
      Format your response with clear sections.
      
      TEXT TO ANALYZE:
      ${text}
    `;
    
    const transformedText = await callDeepSeek(enhancedPrompt, deepSeekKey);
    
    // Cache the result
    await saveToCache(
      supabase,
      inputHash,
      transformationType,
      text,
      transformedText,
      customTemplate
    );

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

