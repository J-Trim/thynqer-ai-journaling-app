import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { componentName, code } = await req.json();
    console.log(`Analyzing component ${componentName}...`);

    const prompt = `Analyze this React component named ${componentName}:

${code}

Provide a detailed analysis focusing on:
1. Component structure and organization
2. Performance considerations
3. TypeScript usage and type safety
4. State management
5. Error handling
6. UI/UX patterns
7. Accessibility
8. Testing considerations

Format your response as a JSON object with these fields:
- complexity: Assess code complexity and maintainability
- performance: Identify potential performance issues or optimizations
- bestPractices: Evaluate adherence to React best practices
- improvements: Suggest specific improvements

Keep each field's content clear and actionable.`;

    console.log('Sending analysis request to GPT-4O...');
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert React code analyzer focusing on TypeScript, performance, and best practices. Provide detailed, actionable feedback.' 
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!openAiResponse.ok) {
      console.error('OpenAI API error:', await openAiResponse.text());
      throw new Error(`OpenAI API error: ${openAiResponse.statusText}`);
    }

    const data = await openAiResponse.json();
    console.log('Received analysis from GPT-4O:', data);
    
    const analysis = JSON.parse(data.choices[0].message.content);

    // Store the analysis in the database
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    console.log('Storing analysis in database...');
    const { error: insertError } = await supabase
      .from('code_analysis')
      .insert([{
        component_name: componentName,
        analysis_result: analysis,
      }]);

    if (insertError) {
      console.error('Error storing analysis:', insertError);
      throw insertError;
    }

    console.log('Analysis stored successfully');
    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-code function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});