import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    
    if (!code) {
      throw new Error('No code provided for analysis');
    }

    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) {
      throw new Error('Missing OpenAI API key');
    }

    const context = `You are an expert TypeScript and React developer. Analyze the following code and suggest improvements for:
    1. Code organization and component structure
    2. Performance optimizations (including React rendering optimizations)
    3. Error handling and edge cases
    4. Type safety and TypeScript best practices
    5. React hooks usage and potential issues
    6. State management approaches
    7. Code reusability and DRY principles
    8. Security considerations
    9. Accessibility improvements
    10. Testing suggestions

    For each category, provide specific, actionable suggestions with code examples where relevant.
    Focus on practical improvements that would have the most impact.`;

    console.log('Sending code analysis request to OpenAI...');
    const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: context },
          { role: "user", content: `Here's the code to analyze:\n\n${code}` }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!openAiRes.ok) {
      const error = await openAiRes.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const analysis = await openAiRes.json();
    console.log('Code analysis completed successfully');

    return new Response(
      JSON.stringify({ analysis: analysis.choices[0].message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-code function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});