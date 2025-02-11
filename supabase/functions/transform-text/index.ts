
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

    // Use custom template if provided, otherwise use default based on type
    let systemPrompt = customTemplate;
    if (!systemPrompt) {
      switch (transformationType) {
        case "Quick Summary":
          systemPrompt = "Provide a brief summary of the main points in 2-3 sentences.";
          break;
        case "Key Insights":
          systemPrompt = "Extract and list the key insights, learnings, and important takeaways from this text.";
          break;
        case "Emotional Analysis":
          systemPrompt = "Analyze the emotional tone and feelings expressed in this text. Identify key emotions and their context.";
          break;
        case "Action Items":
          systemPrompt = "Extract any action items, tasks, or next steps mentioned in this text. Format them as a clear to-do list.";
          break;
        case "Questions":
          systemPrompt = "Generate thoughtful follow-up questions that would help explore the topics mentioned in more depth.";
          break;
        default:
          systemPrompt = "Transform this text while maintaining its core meaning and intent.";
      }
    }

    console.log('Using prompt template:', systemPrompt);

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
            content: `You are a helpful assistant that transforms text based on specific instructions.\n\nINSTRUCTIONS:\n${systemPrompt}\n\nProvide a focused and clear response based on these instructions.`
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
      const error = await response.text();
      console.error('DeepSeek API error:', error);
      throw new Error(`DeepSeek API error: ${error}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from DeepSeek');
    }

    const transformedText = data.choices[0].message.content;
    
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
