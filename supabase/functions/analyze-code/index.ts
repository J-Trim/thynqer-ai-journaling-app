import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { code } = await req.json()
    
    if (!code) {
      throw new Error('No code provided for analysis')
    }

    const deepSeekKey = Deno.env.get('DEEPSEEK_API_KEY')
    if (!deepSeekKey) {
      throw new Error('Missing DeepSeek API key')
    }

    const context = `You are an expert TypeScript and React developer. Analyze the following code and suggest improvements for:
    1. Code organization and component structure
    2. Performance optimizations
    3. Error handling
    4. Type safety
    5. Best practices
    Be specific and provide actionable suggestions.`

    const deepSeekRes = await fetch('https://api.deepseek.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepSeekKey}`
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: context },
          { role: "user", content: `Here's the code to analyze:\n\n${code}` }
        ],
        model: "deepseek-chat",
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!deepSeekRes.ok) {
      const error = await deepSeekRes.text()
      throw new Error(`DeepSeek API error: ${error}`)
    }

    const analysis = await deepSeekRes.json()
    console.log('Code analysis completed:', analysis)

    return new Response(
      JSON.stringify({ analysis: analysis.choices[0].message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in analyze-code function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})