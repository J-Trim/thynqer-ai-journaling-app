import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TransformRequest {
  text: string;
  transformationType: string;
  customTemplate?: string;
}

const getSystemPrompt = (transformationType: string, customTemplate?: string) => {
  if (customTemplate) {
    return `${customTemplate}\n\nIMPORTANT: Provide ONLY the transformed text without any additional commentary, explanations, or conversation.`;
  }

  const prompts: Record<string, string> = {
    'Psychoanalysis': `You are a skilled psychoanalyst trained in multiple therapeutic approaches. Analyze this text through various therapeutic lenses to provide deep psychological insights. Focus on key themes, patterns, and underlying meanings.`,
    'Quick Summary': 'Provide a brief, clear summary of the main points and insights. Be concise and direct.',
    'Emotional Check-In': 'Analyze the emotional content and provide an empathetic reflection focusing on the feelings expressed.',
    'Daily Affirmation': 'Transform the key positive elements into uplifting, personal affirmations.',
    'Mindfulness Reflection': 'Transform this into a mindful reflection focusing on present-moment awareness and acceptance.',
    'Goal Setting': 'Extract and structure the future-oriented elements into clear, achievable goals.',
    'Short Paraphrase': 'Provide a concise paraphrase that captures the essence of the content.',
    'Personal Growth': 'Analyze this text through a personal development lens, identifying key areas for growth.',
    'Professional': 'Transform this text into professional, business-oriented insights.',
    'Social Media': 'Transform this content into engaging social media content while maintaining the core message.'
  };

  return prompts[transformationType] || 'Transform this text while maintaining its core meaning and intent.';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY not configured');
      throw new Error('DEEPSEEK_API_KEY is not configured')
    }

    const requestData: TransformRequest = await req.json();
    const { text, transformationType, customTemplate } = requestData;

    if (!text?.trim() || !transformationType) {
      console.error('Missing required fields:', { hasText: !!text?.trim(), hasType: !!transformationType });
      throw new Error('Missing required fields');
    }

    console.log(`Processing transformation request:`, {
      type: transformationType,
      textLength: text.length,
      hasCustomTemplate: !!customTemplate
    });
    
    const basePrompt = getSystemPrompt(transformationType, customTemplate);
    console.log('Using base prompt:', basePrompt);
    
    console.log('Sending request to DeepSeek API...');
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { 
            role: 'system', 
            content: `You are a direct and efficient text transformer. ${basePrompt}`
          },
          { 
            role: 'user', 
            content: text 
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