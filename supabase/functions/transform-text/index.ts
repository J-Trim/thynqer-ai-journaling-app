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
    'Psychoanalysis': `You are a skilled psychoanalyst trained in multiple therapeutic approaches. Analyze this text through various therapeutic lenses to provide deep psychological insights. Consider:

1. Psychodynamic Analysis:
- Examine unconscious motivations and conflicts
- Identify defense mechanisms
- Explore early life experiences and their impact

2. Cognitive Behavioral Perspective:
- Identify thought patterns and beliefs
- Analyze behavioral patterns
- Suggest potential cognitive restructuring

3. Humanistic/Existential Approach:
- Explore self-actualization themes
- Identify existential concerns
- Analyze personal growth potential

4. Gestalt Therapy Lens:
- Focus on present moment awareness
- Identify unfinished business
- Analyze figure-ground dynamics

5. Jungian Analysis:
- Look for archetypal patterns
- Analyze symbolic content
- Identify shadow elements

6. Attachment Theory:
- Examine relationship patterns
- Identify attachment styles
- Analyze interpersonal dynamics

Provide a comprehensive analysis that integrates insights from these approaches, focusing on patterns, underlying dynamics, and potential areas for growth. 

IMPORTANT: Present your analysis in a clear, structured format that maintains therapeutic professionalism while being accessible and insightful. Focus on providing actionable insights rather than just observations.`,
    'Quick Summary': 'Provide a brief, clear summary of the main points and insights. Provide ONLY the summary without any additional commentary.',
    'Emotional Check-In': 'Analyze the emotional content and provide an empathetic reflection. Provide ONLY the emotional analysis without any additional commentary.',
    'Daily Affirmation': 'Transform the key positive elements into uplifting affirmations. Provide ONLY the affirmations without any additional commentary.',
    'Action Plan': 'Convert the content into a structured action plan with clear, achievable steps. Provide ONLY the action plan without any additional commentary.',
    'Mindfulness Reflection': 'Transform this into a mindful reflection focusing on present-moment awareness. Provide ONLY the reflection without any additional commentary.',
    'Goal Setting': 'Extract and structure the future-oriented elements into clear, achievable goals. Provide ONLY the goals without any additional commentary.',
    'Short Paraphrase': 'Provide a concise paraphrase of the main content. Provide ONLY the paraphrase without any additional commentary.',
    'Motivational Snippet': 'Transform this content into a short, powerful motivational message that inspires action and positive change. Focus on extracting and amplifying the motivational elements while maintaining authenticity. The snippet should be concise, energetic, and immediately actionable. Provide ONLY the motivational snippet without any additional commentary.',
    '2nd Iambic Pentameter Rap': 'Transform this text into a rap using iambic pentameter (10 syllables per line with alternating unstressed and stressed syllables). Make it engaging and rhythmic while maintaining the core message. Provide ONLY the rap without any additional commentary.',
  };

  return prompts[transformationType] || 'Transform this text while maintaining its core meaning and intent. Provide ONLY the transformed content without any additional commentary.';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!Deno.env.get('DEEPSEEK_API_KEY')) {
      console.error('DEEPSEEK_API_KEY not configured');
      throw new Error('DEEPSEEK_API_KEY is not configured')
    }

    const requestData = await req.json() as TransformRequest;
    const { text, transformationType, customTemplate } = requestData;

    if (!text || !transformationType) {
      console.error('Missing required fields:', { hasText: !!text, hasType: !!transformationType });
      throw new Error('Missing required fields');
    }

    console.log(`Processing transformation request:`, {
      type: transformationType,
      textLength: text.length,
      hasCustomTemplate: !!customTemplate
    });
    
    // Get the base prompt
    const basePrompt = getSystemPrompt(transformationType, customTemplate);
    console.log('Using base prompt:', basePrompt);
    
    console.log('Sending request to DeepSeek API...');
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('DEEPSEEK_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { 
            role: 'system', 
            content: `You are a direct and efficient text transformer. ${basePrompt}\n\nIMPORTANT: Your response should contain ONLY the transformed text, without any introduction, explanation, or conversation.`
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

    const data = await response.json();
    console.log('Received response from DeepSeek API:', {
      status: response.status,
      ok: response.ok,
      hasChoices: !!data.choices
    });

    if (!response.ok) {
      console.error('DeepSeek API error:', data.error);
      throw new Error(data.error?.message || 'Failed to get response from DeepSeek');
    }

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
