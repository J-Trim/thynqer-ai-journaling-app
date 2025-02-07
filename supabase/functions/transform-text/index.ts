
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"
import { createHash } from "https://deno.land/std@0.168.0/hash/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
      throw new Error('DEEPSEEK_API_KEY is not configured')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create a hash of the input text for cache lookup
    const inputHash = createHash('md5')
      .update(text + (customTemplate || ''))
      .toString();

    // Check cache first
    console.log('Checking cache for transformation...');
    const { data: cacheHit } = await supabase
      .from('summary_cache')
      .select('cached_result')
      .eq('input_hash', inputHash)
      .eq('transformation_type', transformationType)
      .single();

    if (cacheHit) {
      console.log('Cache hit found, returning cached result');
      return new Response(
        JSON.stringify({ transformedText: cacheHit.cached_result }),
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
    
    console.log('Sending request to DeepSeek API...');
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
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
            content: enhancedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('DeepSeek API error:', error);
      throw new Error(error.error?.message || 'Failed to get response from DeepSeek');
    }

    const data = await response.json();
    console.log('Received response from DeepSeek API:', {
      status: response.status,
      ok: response.ok,
      hasChoices: !!data.choices
    });

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid response format from DeepSeek:', data);
      throw new Error('Invalid response format from DeepSeek');
    }

    const transformedText = data.choices[0].message.content;
    
    // Cache the result
    console.log('Caching transformation result...');
    const { error: cacheError } = await supabase
      .from('summary_cache')
      .insert({
        input_text: text,
        transformation_type: transformationType,
        prompt_template: customTemplate || basePrompt,
        cached_result: transformedText,
        input_hash: inputHash
      });

    if (cacheError) {
      console.error('Error caching result:', cacheError);
      // Don't throw here, we still want to return the transformation
    }

    console.log('Successfully transformed text, length:', transformedText.length);

    return new Response(
      JSON.stringify({ transformedText }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
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

const getSystemPrompt = (transformationType: string) => {
  const prompts: Record<string, string> = {
    'Psychoanalysis': `Analyze this text through various therapeutic lenses to provide deep psychological insights. Focus on:
      - Key emotional patterns and themes
      - Underlying motivations and beliefs
      - Potential areas for growth and self-awareness`,
    'Quick Summary': `Provide a clear, concise summary that captures:
      - Main points and key insights
      - Important details and context
      - Core message or takeaway`,
    'Emotional Check-In': `Analyze the emotional content by:
      - Identifying primary and secondary emotions
      - Noting emotional patterns or shifts
      - Suggesting potential emotional triggers`,
    'Daily Affirmation': `Transform key positive elements into:
      - Personalized, powerful affirmations
      - Growth-oriented statements
      - Confidence-building messages`,
    'Mindfulness Reflection': `Create a mindful reflection focusing on:
      - Present-moment awareness
      - Non-judgmental observations
      - Mindful insights and learnings`,
    'Goal Setting': `Extract and structure future-oriented elements into:
      - Clear, achievable goals
      - Action steps
      - Success metrics`,
    'Short Paraphrase': `Provide a concise paraphrase that:
      - Maintains core meaning
      - Highlights key points
      - Uses clear, direct language`
  };

  return prompts[transformationType] || 'Transform this text while maintaining its core meaning and intent.';
}
