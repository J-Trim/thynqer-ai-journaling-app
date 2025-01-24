import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')

interface TransformRequest {
  text: string;
  transformationType: string;
  customTemplate?: string;
}

const getSystemPrompt = (transformationType: string, customTemplate?: string) => {
  if (customTemplate) {
    return customTemplate;
  }

  const prompts: Record<string, string> = {
    'Blog Post': 'Transform this journal entry into a well-structured blog post. Include a compelling introduction, clear sections, and a conclusion.',
    'Email': 'Convert this journal entry into a professional email format. Keep it concise and clear.',
    'Instagram Post': 'Transform this into an engaging Instagram post with appropriate tone and style. Include relevant hashtag suggestions.',
    'YouTube Script': 'Convert this journal entry into a YouTube video script with clear sections for intro, main content, and outro.',
    'X (Twitter) Post': 'Transform this into a concise, engaging tweet thread format, keeping within character limits.',
    'Instagram Reel / TikTok Clip': 'Convert this into a short-form video script optimized for Instagram Reels or TikTok.',
    'Podcast Show Notes': 'Transform this into detailed podcast show notes with timestamps, key points, and resources.',
    'LinkedIn Article': 'Convert this into a professional LinkedIn article format with business insights.',
    'Motivational Snippet': 'Extract and transform the key motivational elements into an inspiring message.',
    'Quick Summary': 'Provide a brief, clear summary of the main points and insights.',
    'Emotional Check-In': 'Analyze the emotional content and provide an empathetic reflection.',
    'Daily Affirmation': 'Transform the key positive elements into uplifting affirmations.',
    'Action Plan': 'Convert the content into a structured action plan with clear, achievable steps.',
    'Psychoanalysis': 'Provide a therapy-style analysis of the thoughts and feelings expressed.',
    'Mindfulness Reflection': 'Transform this into a mindful reflection focusing on present-moment awareness.',
    'Goal Setting': 'Extract and structure the future-oriented elements into clear, achievable goals.',
    'Short Paraphrase': 'Provide a concise paraphrase of the main content.',
  };

  return prompts[transformationType] || 'Transform this text while maintaining its core meaning and intent.';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is not configured')
    }

    const { text, transformationType, customTemplate } = await req.json() as TransformRequest

    console.log(`Processing transformation request of type: ${transformationType}`)
    
    const systemPrompt = getSystemPrompt(transformationType, customTemplate)
    
    console.log('Sending request to DeepSeek API...')
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
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