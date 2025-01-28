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
    'Blog Post': 'Transform this journal entry into a well-structured blog post. Include a compelling introduction, clear sections, and a conclusion. Provide ONLY the transformed blog post without any additional commentary.',
    'Email': 'Convert this journal entry into a professional email format. Keep it concise and clear. Provide ONLY the email content without any additional commentary.',
    'Instagram Post': 'Transform this into an engaging Instagram post with appropriate tone and style. Include relevant hashtag suggestions at the end. Provide ONLY the post content without any additional commentary.',
    'YouTube Script': 'Convert this journal entry into a YouTube video script with clear sections for intro, main content, and outro. Provide ONLY the script without any additional commentary.',
    'X (Twitter) Post': 'Transform this into a concise, engaging tweet thread format, keeping within character limits. Provide ONLY the tweet thread without any additional commentary.',
    'Instagram Reel / TikTok Clip': 'Convert this into a short-form video script optimized for Instagram Reels or TikTok. Provide ONLY the script without any additional commentary.',
    'Podcast Show Notes': 'Transform this into detailed podcast show notes with timestamps, key points, and resources. Provide ONLY the show notes without any additional commentary.',
    'LinkedIn Article': 'Convert this into a professional LinkedIn article format with business insights. Provide ONLY the article content without any additional commentary.',
    'Motivational Snippet': 'Extract and transform the key motivational elements into an inspiring message. Provide ONLY the motivational message without any additional commentary.',
    'Quick Summary': 'Provide a brief, clear summary of the main points and insights. Provide ONLY the summary without any additional commentary.',
    'Emotional Check-In': 'Analyze the emotional content and provide an empathetic reflection. Provide ONLY the emotional analysis without any additional commentary.',
    'Daily Affirmation': 'Transform the key positive elements into uplifting affirmations. Provide ONLY the affirmations without any additional commentary.',
    'Action Plan': 'Convert the content into a structured action plan with clear, achievable steps. Provide ONLY the action plan without any additional commentary.',
    'Psychoanalysis': 'Provide a therapy-style analysis of the thoughts and feelings expressed. Provide ONLY the analysis without any additional commentary.',
    'Mindfulness Reflection': 'Transform this into a mindful reflection focusing on present-moment awareness. Provide ONLY the reflection without any additional commentary.',
    'Goal Setting': 'Extract and structure the future-oriented elements into clear, achievable goals. Provide ONLY the goals without any additional commentary.',
    'Short Paraphrase': 'Provide a concise paraphrase of the main content. Provide ONLY the paraphrase without any additional commentary.',
    '2nd Iambic Pentameter Rap': 'Transform this text into a rap using iambic pentameter (10 syllables per line with alternating unstressed and stressed syllables). Make it engaging and rhythmic while maintaining the core message. Provide ONLY the rap without any additional commentary.',
  };

  return prompts[transformationType] || 'Transform this text while maintaining its core meaning and intent. Provide ONLY the transformed content without any additional commentary.';
}

const enhancePrompt = async (prompt: string): Promise<string> => {
  if (!Deno.env.get('DEEPSEEK_API_KEY')) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  console.log('Enhancing prompt with DeepSeek:', prompt);
  
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
          content: 'You are an AI prompt engineer. Your task is to enhance and improve the following prompt to make it more specific, detailed, and effective. The enhanced prompt should maintain the original intent but add structure, clarity, and specific instructions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to enhance prompt with DeepSeek');
  }

  return data.choices[0].message.content;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!Deno.env.get('DEEPSEEK_API_KEY')) {
      throw new Error('DEEPSEEK_API_KEY is not configured')
    }

    const { text, transformationType, customTemplate } = await req.json() as TransformRequest

    console.log(`Processing transformation request of type: ${transformationType}`)
    console.log('Custom template:', customTemplate)
    
    // Get the base prompt
    const basePrompt = getSystemPrompt(transformationType, customTemplate)
    
    // Try to get an enhanced prompt from the database or create a new one
    const { data: enhancedPrompts, error: fetchError } = await supabase
      .from('enhanced_prompts')
      .select('enhanced_template')
      .eq('original_type', transformationType)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching enhanced prompt:', fetchError);
      throw fetchError;
    }

    let enhancedPrompt = enhancedPrompts?.enhanced_template;

    if (!enhancedPrompt) {
      console.log('No enhanced prompt found, creating one...');
      enhancedPrompt = await enhancePrompt(basePrompt);

      const { error: insertError } = await supabase
        .from('enhanced_prompts')
        .insert({
          user_id: auth.uid(),
          original_type: transformationType,
          enhanced_template: enhancedPrompt
        });

      if (insertError) {
        console.error('Error saving enhanced prompt:', insertError);
        throw insertError;
      }
    }

    console.log('Using enhanced prompt:', enhancedPrompt);
    
    console.log('Sending request to DeepSeek API...')
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
            content: `You are a direct and efficient text transformer. ${enhancedPrompt}\n\nIMPORTANT: Your response should contain ONLY the transformed text, without any introduction, explanation, or conversation. Do not include phrases like "Here's the transformed text:" or "I hope this helps!"`
          },
          { 
            role: 'user', 
            content: text 
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    const data = await response.json()
    console.log('Received response from DeepSeek API')

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get response from DeepSeek')
    }

    const transformedText = data.choices[0].message.content

    return new Response(
      JSON.stringify({ transformedText }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in transform-text function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})