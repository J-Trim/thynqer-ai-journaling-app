import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code } = await req.json()
    
    if (!code) {
      throw new Error('No code provided for analysis')
    }

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Call OpenAI for code analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: `You are a senior React developer specializing in code analysis. 
          Analyze the provided React component and provide detailed feedback on:
          1. Component length and complexity
          2. State management
          3. Side effects organization
          4. Performance considerations
          5. Error handling
          6. Accessibility
          7. Code organization and potential refactoring suggestions
          8. Best practices compliance
          Be specific and provide actionable recommendations.`
        }, {
          role: "user",
          content: `Please analyze this React component:\n\n${code}`
        }],
        temperature: 0.3,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`)
    }

    const result = await response.json()
    const analysis = result.choices[0].message.content

    // Store the analysis in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (supabaseUrl && supabaseServiceRole) {
      const supabase = createClient(supabaseUrl, supabaseServiceRole)
      
      await supabase
        .from('code_analysis')
        .insert({
          component_name: 'JournalEntryForm',
          analysis,
          analyzed_at: new Date().toISOString()
        })
    }

    return new Response(
      JSON.stringify({ analysis }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Analysis error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})